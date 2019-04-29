package rest

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
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
		{http.MethodPost, "/tracers/requests", AddRequests},
		//		{http.MethodPatch, "/tracers/request", UpdateRequest},
		//		{http.MethodGet, "/tracers/generate", GenerateTracer},
		//	{http.MethodGet, "/tracers/{tracerID}/request", GetRequest},
		{http.MethodPut, "/tracers/{tracerID}", EditTracer},
		{http.MethodPost, "/tracers/{tracerPayload}/request", AddRequestByTracerPayload},
		{http.MethodGet, "/tracers/{tracerID}", GetTracer},
		{http.MethodGet, "/tracers", GetTracers},
		{http.MethodPost, "/tracers/{tracerID}/events", AddEvent},
		{http.MethodGet, "/tracers/{tracerID}/events", GetEvents},
		//{http.MethodPost, "/tracers/{tracerID}/events/{contextID}/reproductions", StartReproductions},
		//{http.MethodPut, "/tracers/{tracerID}/events/{contextID}/reproductions/{reproID}", UpdateReproduction},
		{http.MethodPost, "/tracers/events/bulk", AddEvents},
		//		{http.MethodGet, "/config", GetConfig},
		//		{http.MethodPut, "/projects", SwitchProject},
		//		{http.MethodDelete, "/projects", DeleteProject},
		//		{http.MethodGet, "/projects", GetProjects},
	}

	apiMw = []func(http.Handler) http.Handler{
		handlers.CORS(
			handlers.AllowedHeaders([]string{"X-TRACY", "Hoot"}),
			handlers.AllowedMethods([]string{"GET", "PUT", "POST", "DELETE"})),
		uuidMiddleware,
		customHeaderMiddleware,
		applicationJSONMiddleware,
		cacheMiddleware,
	}
)

// Configure configures all the HTTP routes and assigns them handler functions.
func Configure() {
	Router = mux.NewRouter()
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

// uuidMiddleware ensures that the UUID is properly added to the Hoot header and
// if so, adds it to the request context.
type hootHeader string

var hh = hootHeader("HOOT")

func uuidMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var hid string
		if hid = r.Header.Get("HOOT"); hid == "" {
			returnError(w, fmt.Errorf("No UUID header found in the Hoot header"))
			return
		}
		h, err := uuid.Parse(hid)
		if err != nil {
			returnError(w, err)
			return
		}
		nr := r.WithContext(context.WithValue(r.Context(), hh, &h))
		next.ServeHTTP(w, nr)
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
			returnError(w, fmt.Errorf("no hoot header or incorrect host header..."))
			return
		}
		next.ServeHTTP(w, r)
	})
}
