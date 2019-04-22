package rest

import (
	"crypto/sha1"
	"encoding/hex"
	"flag"
	"fmt"
	"net/http"
	"net/http/httptest"
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
		{http.MethodPatch, "/tracers/request", updateRequest},
		{http.MethodGet, "/tracers/generate", GenerateTracer},
		{http.MethodGet, "/tracers/{tracerID}/request", GetRequest},
		{http.MethodPost, "/tracers/{tracerID}/request", AddRequest},
		{http.MethodGet, "/tracers/{tracerID}", GetTracer},
		{http.MethodGet, "/tracers", GetTracers},
		{http.MethodPost, "/tracers/{tracerID}/events", AddEvent},
		{http.MethodPut, "/tracers/{tracerID}", EditTracer},
		{http.MethodGet, "/tracers/{tracerID}/events", GetEvents},
		{http.MethodPost, "/tracers/{tracerID}/events/{contextID}/reproductions", StartReproductions},
		{http.MethodPut, "/tracers/{tracerID}/events/{contextID}/reproductions/{reproID}", UpdateReproduction},
		{http.MethodPost, "/tracers/events/bulk", AddEvents},
		{http.MethodGet, "/config", GetConfig},
		{http.MethodPut, "/projects", SwitchProject},
		{http.MethodDelete, "/projects", DeleteProject},
		{http.MethodGet, "/projects", GetProjects},
	}

	apiMw = []func(http.Handler) http.Handler{
		handlers.CORS(
			handlers.AllowedHeaders([]string{"X-TRACY", "Hoot"}),
			handlers.AllowedMethods([]string{"GET", "PUT", "POST", "DELETE"})),
		customHeaderMiddleware,
		applicationJSONMiddleware,
		cacheMiddleware,
	}
)

//Jake said he loves enums so we will give him enums
const (
	PROXY_ONLY = iota
	FULL
	API_ONLY
)

// Configure configures all the HTTP routes and assigns them handler functions.
func Configure(mode int) {
	Router = mux.NewRouter()
	if mode >= FULL { //make this over complicated so Jake hates me

		api := Router.PathPrefix("/api/tracy").Subrouter()

		for _, row := range apiTable {
			api.
				Path(row.path).
				Methods(row.method, http.MethodOptions).
				HandlerFunc(row.handler).
				Name(fmt.Sprintf("%s:%s", row.method, row.path))
		}
		for _, m := range apiMw {
			api.Use(m)
		}

		wui := Router.NewRoute().Name("webUI").BuildOnly()
		Router.MatcherFunc(func(req *http.Request, m *mux.RouteMatch) bool {
			// If the host header indicates the request is going straight to
			// the app, consider it going to the UI, direct them to it.
			if req.Method == http.MethodGet && strings.HasSuffix(req.Host, fmt.Sprintf("%d", configure.Current.TracyServer.Port)) &&
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

		ws := Router.NewRoute().Name("websocket").BuildOnly()
		Router.MatcherFunc(func(req *http.Request, m *mux.RouteMatch) bool {
			// If the host header indicates the request is going straight to
			// the app, consider it going to the UI, direct them to it.
			if req.Method == http.MethodGet && req.URL.Path == "/ws" && strings.HasSuffix(req.Host, fmt.Sprintf("%d", configure.Current.TracyServer.Port)) {
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

		thost := Router.NewRoute().Name("tracyHost").BuildOnly()
		Router.MatcherFunc(func(req *http.Request, m *mux.RouteMatch) bool {
			if strings.HasPrefix(req.Host, "tracy") {
				m.Route = thost
				m.Handler = h
				m.MatchErr = nil
				return true
			}
			return false
		})

	}

	if mode <= FULL {

		// Catch everything else.
		t, u, d, bp, bufp := configure.ProxyServer()
		p := proxy.New(t, u, d, bp, bufp)

		// For CONNECT requests, the path will be an absolute URL
		Router.SkipClean(true)

		// Proxy catches everything, except for requests back to itself.
		prox := Router.NewRoute().Name("proxy").BuildOnly()
		Router.MatcherFunc(func(req *http.Request, m *mux.RouteMatch) bool {
			server, err := configure.ParseServer(req.Host)
			if err != nil {
				log.Error.Print(err)
				return false
			}
			//SANITY CHECK: if we are about to send a request back to the proxy,
			// we hit a recursion and something is up.
			if req.Method != http.MethodConnect && server.Equal(configure.Current.TracyServer) && mode != PROXY_ONLY {
				return false
			}

			m.Route = prox
			m.Handler = p
			m.MatchErr = nil
			return true
		})

		// This is the catch all route. Specifically, it should catch recursion
		// requests and return a 404 instead.
		Router.MatcherFunc(func(req *http.Request, m *mux.RouteMatch) bool {
			m.Route = nil
			m.Handler = http.NotFoundHandler()
			m.MatchErr = nil
			return true
		})
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

			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("No hoot header or incorrect host header..."))
			return
		}
		next.ServeHTTP(w, r)
	})
}
