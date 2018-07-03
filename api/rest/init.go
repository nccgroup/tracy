package rest

import (
	"crypto/sha1"
	"encoding/hex"
	"flag"
	l "log"
	"net/http"
	"net/http/httptest"
	"strings"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
)

var (
	// RestServer is the HTTP server that serves the API.
	RestServer *http.Server

	// RestRouter is the router used to map all API functionality. Exposed for
	// testing.
	RestRouter *mux.Router
)

// Configure configures all the HTTP routes and assigns them handler functions.
func Configure() {
	RestRouter = mux.NewRouter()
	RestRouter.Methods("POST").Path("/tracers").HandlerFunc(AddTracers)
	RestRouter.Methods("GET").Path("/tracers/generate").HandlerFunc(GenerateTracer)
	RestRouter.Methods("GET").Path("/tracers/{tracerID}/request").HandlerFunc(GetRequest)
	RestRouter.Methods("GET").Path("/tracers/{tracerID}").HandlerFunc(GetTracer)
	RestRouter.Methods("GET").Path("/tracers").HandlerFunc(GetTracers)
	RestRouter.Methods("GET").Path("/ws").HandlerFunc(WebSocket)
	RestRouter.Methods("POST").Path("/tracers/{tracerID}/events").HandlerFunc(AddEvent)
	RestRouter.Methods("GET").Path("/tracers/{tracerID}/events").HandlerFunc(GetEvents)
	RestRouter.Methods("POST").Path("/tracers/events/bulk").HandlerFunc(AddEvents)
	RestRouter.Methods("GET").Path("/config").HandlerFunc(GetConfig)

	// The base application page. Don't use the compiled assets unless
	// in production.
	if v := flag.Lookup("test.v"); v != nil || configure.DebugUI {
		RestRouter.PathPrefix("/").Handler(http.FileServer(http.Dir("./api/view/build")))
	} else {
		RestRouter.PathPrefix("/").Handler(http.FileServer(assetFS()))
	}

	addr, err := configure.ReadConfig("tracer-server")
	if err != nil {
		log.Error.Fatal(err)
		return
	}

	corsOptions := []handlers.CORSOption{
		handlers.AllowedOriginValidator(func(a string) bool {
			var hp string
			if hs := strings.Split(a, "//"); len(hs) == 1 {
				hp = hs[0]
			} else {
				hp = hs[1]
			}

			p := "80"
			var h string
			if hps := strings.Split(hp, ":"); len(hps) > 1 {
				p = hps[1]
				h = hps[0]
			} else {
				h = hps[0]
			}

			if h == "localhost" || h == "127.0.0.1" {
				if p == "3000" {
					// debug port
					return true
				}

				cps := strings.Split(addr.(string), ":")
				// If the configured port is equal to port that
				// sent the request.
				if len(cps) == 2 && cps[1] == p {
					return true
				}
			}

			return false
		}),
		handlers.AllowedHeaders([]string{"X-TRACY", "Hoot"}),
	}

	// API middleware for: CORS, caching, content type, and custom headers
	// (CSRF).
	restHandler := handlers.CORS(corsOptions...)(RestRouter)
	restHandler = customHeaderMiddleware(restHandler)
	restHandler = applicationJSONMiddleware(restHandler)
	restHandler = cacheMiddleware(restHandler)

	RestServer = &http.Server{
		Handler: restHandler,
		Addr:    addr.(string),
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
		ErrorLog:     log.Error.(*l.Logger),
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
			// They are connecting over a websocket
			!strings.HasPrefix(r.URL.String(), "/ws") &&
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
