package rest

import (
	"crypto/sha1"
	"encoding/hex"
	"flag"
	"fmt"
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
		api.Methods(row.method).Path(row.path).
			HandlerFunc(row.handler).Name(fmt.Sprintf("%s:%s", row.method, row.path))
	}

	corsOptions := []handlers.CORSOption{
		handlers.AllowedOriginValidator(func(a string) bool {
			if a == "" {
				return true
			}
			u, err := url.Parse(a)
			if err != nil {
				return false
			}

			if u.Hostname() == "localhost" || u.Hostname() == "127.0.0.1" || u.Hostname() == "tracy" {
				var p uint64
				if u.Port() == "" {
					p = 80
				} else {

					p, err = strconv.ParseUint(u.Port(), 10, 32)
					if err != nil {
						return false
					}
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

	// API middleware for: CORS, caching, content type, and custom headers
	// (CSRF).
	mw := []func(http.Handler) http.Handler{
		handlers.CORS(corsOptions...),
		customHeaderMiddleware,
		applicationJSONMiddleware,
		cacheMiddleware,
	}
	for _, m := range mw {
		api.Use(m)
	}

	// Options requests don't have custom headers. So no hoot header will be
	// present.
	options := Router.
		Methods(http.MethodOptions).
		Subrouter()
	o := Router.NewRoute().Name("options").BuildOnly()
	options.MatcherFunc(func(req *http.Request, m *mux.RouteMatch) bool {
		// If the host header indicates the request is going straight to
		// the app, consider it going to the UI and use the CORS rules above.
		if strings.HasSuffix(req.Host, fmt.Sprintf("%d", configure.Current.TracyServer.Port)) {
			m.Route = o
			m.Handler = handlers.CORS(corsOptions...)(nil)
			m.MatchErr = nil
			return true
		}
		return false
	})

	webUI := Router.Methods(http.MethodGet).Subrouter()
	wui := Router.NewRoute().Name("webUI").BuildOnly()
	webUI.MatcherFunc(func(req *http.Request, m *mux.RouteMatch) bool {
		// If the host header indicates the request is going straight to
		// the app, consider it going to the UI, direct them to it.
		if strings.HasSuffix(req.Host, fmt.Sprintf("%d", configure.Current.TracyServer.Port)) &&
			(req.URL.Path == "/" || req.URL.Path == "" || strings.HasPrefix(req.URL.Path, "/static") || strings.HasPrefix(req.URL.Path, "/tracy.ico")) {
			m.Route = wui
			if v := flag.Lookup("test.v"); v != nil || configure.Current.DebugUI {
				m.Handler = http.FileServer(http.Dir("./api/view/build"))
			} else {
				m.Handler = http.FileServer(assetFS())
			}
			m.MatchErr = nil
			return true
		}
		return false
	})

	websocket := Router.Path("/ws").Subrouter()
	ws := Router.NewRoute().Name("websocket").BuildOnly()
	websocket.MatcherFunc(func(req *http.Request, m *mux.RouteMatch) bool {
		// If the host header indicates the request is going straight to
		// the app, consider it going to the UI, direct them to it.
		if strings.HasSuffix(req.Host, fmt.Sprintf("%d", configure.Current.TracyServer.Port)) {
			m.Route = ws
			m.Handler = http.HandlerFunc(WebSocket)
			m.MatchErr = nil

			return true
		}
		return false
	})

	var h http.Handler
	if v := flag.Lookup("test.v"); v != nil || configure.Current.DebugUI {
		h = http.FileServer(http.Dir("./api/view/build"))
	} else {
		h = http.FileServer(assetFS())
	}

	// Catch everything else.
	t, u, d, bp, bufp := configure.ProxyServer()
	p := proxy.New(t, u, d, bp, bufp)

	// For CONNECT requests, the path will be an absolute URL
	Router.SkipClean(true)
	thost := Router.NewRoute().Name("tracyHost").BuildOnly()
	prox := Router.NewRoute().Name("proxy").BuildOnly()
	Router.MatcherFunc(func(req *http.Request, m *mux.RouteMatch) bool {
		if strings.HasPrefix(req.Host, "tracy") {
			m.Route = thost
			m.Handler = h
			m.MatchErr = nil
			return true
		}
		m.Route = prox
		m.Handler = p
		m.MatchErr = nil
		return true
	})

	Server = &http.Server{
		Handler: Router,
		Addr:    configure.Current.TracyServer.Addr(),
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
		ErrorLog:     log.Error,
	}
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
