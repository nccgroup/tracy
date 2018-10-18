package rest

import (
	"crypto/sha1"
	"encoding/hex"
	"flag"
	l "log"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
	"github.com/nccgroup/tracy/proxy"
)

var (
	// Server is the HTTP server that serves the API.
	Server *http.Server

	// Router is the router used to map all API functionality. Exposed for
	// testing.
	Router *mux.Router

	apiTable = []struct {
		method  string
		path    string
		handler func(http.ResponseWriter, *http.Request)
	}{
		{http.MethodPost, "/tracers", AddTracers},
		{http.MethodPut, "/tracers/{tracerID}", EditTracer},
		{http.MethodGet, "/tracers/generate", GenerateTracer},
		{http.MethodGet, "/tracers/{tracerID}/request", GetRequest},
		{http.MethodGet, "/tracers/{tracerID}", GetTracer},
		{http.MethodGet, "/tracers", GetTracers},
		{http.MethodPost, "/tracers/{tracerID}/events", AddEvent},
		{http.MethodGet, "/tracers/{tracerID}/events", GetEvents},
		{http.MethodPost, "/tracers/{tracerID}/events/{contextID}/reproductions", StartReproductions},
		{http.MethodPut, "/tracers/{tracerID}/events/{contextID}/reproductions/{reproID}", UpdateReproduction},
		{http.MethodPost, "/tracers/events/bulk", AddEvents},
		{http.MethodGet, "/config", GetConfig},
		{http.MethodPut, "/projects", SwitchProject},
		{http.MethodDelete, "/projects", DeleteProject},
		{http.MethodGet, "/projects", GetProjects},
	}
)

// Configure configures all the HTTP routes and assigns them handler functions.
func Configure() {
	Router = mux.NewRouter()
	api := Router.
		Headers("Hoot", "!").
		Subrouter()

	for _, row := range apiTable {
		api.Methods(row.method).Path(row.path).HandlerFunc(row.handler)
	}
	// Since we can only use the host header to tell where the request needs
	// to be routed to, we need to map several different host header variations
	// to the web application so that it works when the user is not proxying
	// traffic and when they are proxying traffic.

	// 1. User is proxying traffic and they navigate to tracy/ in browser
	// URL bar.
	addWebRouteByHost("tracy", Router)
	// 2. User is navigating directly to the configured server in a web
	// browser.
	addWebRouteByHost(configure.Current.TracyServer.Addr(), Router)

	// where things get tricky:
	// 3. User configured tracy to run on 127.0.0.1, but the host header
	// reads localhost instead (they navigate to localhost).
	if configure.Current.TracyServer.Hostname == "127.0.0.1" {
		addWebRouteByHost(strings.Replace(configure.Current.TracyServer.Addr(),
			"127.0.0.1", "localhost", -1), Router)
	}
	// 4. and vice versa.
	if configure.Current.TracyServer.Hostname == "localhost" {
		addWebRouteByHost(strings.Replace(configure.Current.TracyServer.Addr(),
			"localhost", "127.0.0.1", -1), Router)
	}
	// 5. User configured tracy to bind to all interfaces.
	if configure.Current.TracyServer.Hostname == "0.0.0.0" {
		ifaces, err := net.Interfaces()
		if err != nil {
			l.Fatal(err)
		}

		for _, i := range ifaces {
			addrs, err := i.Addrs()

			if err != nil {
				l.Fatal(err)
			}

			for _, addr := range addrs {
				var ip net.IP
				switch v := addr.(type) {
				case *net.IPNet:
					ip = v.IP
				case *net.IPAddr:
					ip = v.IP
				}

				addWebRouteByHost(strings.Replace(configure.Current.TracyServer.Addr(),
					"0.0.0.0", ip.String(), -1), Router)
			}
		}
	}
	// 6. User is trying to access the web UI from a different network, such
	// as over a virtual machine or on a hosted machine on the internet and
	// wants to use a route to get the UI rather doing all this hostname
	// checking.
	addWebRouteByPath("/tracyui", Router)
	// 7. User is trying to access the web UI from a CNAME record for the IP
	// they have configured tracy to run on. Requires the user to set up
	// Current.ExternalHostname in the configuration file.
	if configure.Current.ExternalHostname != "" {
		addWebRouteByHost(configure.Current.ExternalHostname, Router)
	}

	// Catch everything else.
	t, u, d := configure.ProxyServer()
	p := proxy.New(t, u, d)
	// For CONNECT requests, the path will be an absolute URL
	Router.SkipClean(true)
	Router.MatcherFunc(func(req *http.Request, m *mux.RouteMatch) bool {
		m.Handler = p
		return true
	})

	corsOptions := []handlers.CORSOption{
		handlers.AllowedOriginValidator(func(a string) bool {
			if a == "" {
				return true
			}
			u, err := url.Parse(a)
			if err != nil {
				return false
			}

			if u.Hostname() == "localhost" || u.Hostname() == "127.0.0.1" {
				p, err := strconv.ParseUint(u.Port(), 10, 32)
				if err != nil {
					return false
				}
				if uint(p) == configure.Current.TracyServer.Port {
					return true
				}

				for _, v := range configure.Current.ServerWhitelist {
					if uint(p) == v.Port {
						return true
					}
				}

			}

			return false
		}),
		handlers.AllowedHeaders([]string{"X-TRACY", "Hoot"}),
		handlers.AllowedMethods([]string{"GET", "PUT", "POST", "DELETE"}),
	}

	// Options requests don't have custom headers. So no hoot header will be
	// present.
	Router.Use(handlers.CORS(corsOptions...))

	// API middleware for: CORS, caching, content type, and custom headers
	// (CSRF).
	mw := []func(http.Handler) http.Handler{
		customHeaderMiddleware,
		applicationJSONMiddleware,
		cacheMiddleware,
	}
	for _, m := range mw {
		api.Use(m)
	}

	Server = &http.Server{
		Handler: Router,
		Addr:    configure.Current.TracyServer.Addr(),
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
		ErrorLog:     log.Error,
	}
}

// addWebRouteByPath creates routes for the base application page. Don't use the compiled
// assets unless in production.
func addWebRouteByPath(path string, router *mux.Router) {
	if v := flag.Lookup("test.v"); v != nil || configure.Current.DebugUI {
		router.
			Path(path).
			Handler(http.FileServer(http.Dir("./api/view/build")))
	} else {
		router.
			Path(path).
			Handler(http.FileServer(assetFS()))
	}

}

// addWebRouteByHost creates routes for the base application page. Don't use the compiled
// assets unless in production.
func addWebRouteByHost(host string, router *mux.Router) {
	if v := flag.Lookup("test.v"); v != nil || configure.Current.DebugUI {
		router.
			Host(host).
			Handler(http.FileServer(http.Dir("./api/view/build")))
	} else {
		router.
			Host(host).
			Handler(http.FileServer(assetFS()))
	}

	// Have to do the WS route separate because you can't add custom headers
	// to WS upgrades from the browser.
	router.Methods(http.MethodGet).Path("/ws").HandlerFunc(WebSocket)
}

// applicationJSONMiddleware adds the 'application/json' content type to API
// responses.
func applicationJSONMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// The root path and its assets are not application/json
		if strings.HasPrefix(r.RequestURI, "/tracers") {
			w.Header().Set("Content-Type", "application/json")
		}
		next.ServeHTTP(w, r)
	})
}

// cacheMiddleware adds caching headers to get requests that haven't changed.
func cacheMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Don't want to cache stuff from the websocket
		if strings.HasPrefix(r.RequestURI, "/ws") {
			next.ServeHTTP(w, r)
			return
		}

		rec := httptest.NewRecorder()
		next.ServeHTTP(rec, r)

		// We copy the original headers first.
		for k, v := range rec.Header() {
			w.Header()[k] = v
		}

		// Only want to cache responses from HTTP GET requests.
		body := rec.Body.Bytes()
		if r.Method != http.MethodGet {
			w.WriteHeader(rec.Code)
			w.Write(body)
			return
		}

		// Check if the request is cached
		eTagHash := r.Header.Get("If-None-Match")
		sum := sha1.Sum(body)
		sumStr := hex.EncodeToString(sum[:len(sum)])
		if eTagHash == "" {
			// First time requesting something. There will be no
			// Etag header.
			w.Header().Set("Etag", sumStr)
			w.WriteHeader(rec.Code)
			w.Write(body)
		} else if eTagHash == sumStr {
			// Cache hit!
			w.WriteHeader(http.StatusNotModified)
			w.Write([]byte(""))
		} else {
			// Cache miss; set a new Etag header for them.
			w.Header().Set("Etag", sumStr)
			w.WriteHeader(rec.Code)
			w.Write(body)
		}
	})
}

// customHeaderMiddleware adds the custom 'Hoot' header that is used
// as our CSRF protection. This middleware also protects CSRF.
func customHeaderMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// They are navigating to the root of the server, it is just the UI, so allow them.
		if !(r.URL.String() == "/" || strings.HasPrefix(r.URL.String(), "/static")) &&
			// They are making a request to the actual web application (not a DNS rebinding issue.), and they were able to set the Hoot header, so allow them.
			!((strings.Split(r.Host, ":")[0] == "localhost" || strings.Split(r.Host, ":")[0] == "127.0.0.1") && r.Header.Get("Hoot") != "") &&
			// They are making an OPTIONS request
			strings.ToLower(r.Method) != "options" {

			log.Error.Print("Here?")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("No hoot header or incorrect host header..."))
			return
		}
		next.ServeHTTP(w, r)
	})
}
