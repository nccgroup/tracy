package rest

import (
	"compress/gzip"
	"crypto/sha1"
	"encoding/hex"
	"flag"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"net/http"
	"net/http/httptest"
	"time"
	"tracy/configure"
	"tracy/log"
)

/*RestServer is the HTTP server that serves all the API. */
var RestServer *http.Server

/*RestRouter is the router used to map all API functionality. Exposed for testing. */
var RestRouter *mux.Router

/*ConfigServer is the hardcoded HTTP server that is mainly used by the extension to query the config. */
var ConfigServer *http.Server

/*ConfigRouter is the router used to map the configuration functionality. Exposed for testing. */
var ConfigRouter *mux.Router

/*Configure is a helper that configures all the HTTP routes and their corresponding handler. */
func Configure() {
	RestRouter = mux.NewRouter()
	ConfigRouter = mux.NewRouter()
	/* Define our RESTful routes for tracers. Tracers are indexed by their database ID. */
	RestRouter.Methods("POST").Path("/tracers").HandlerFunc(AddTracers)
	RestRouter.Methods("GET").Path("/tracers/generate").HandlerFunc(GenerateTracer)
	RestRouter.Methods("GET").Path("/tracers/{tracerID}/request").HandlerFunc(GetRequest)

	RestRouter.Methods("GET").Path("/tracers/{tracerID}").HandlerFunc(GetTracer)
	RestRouter.Methods("GET").Path("/tracers").HandlerFunc(GetTracers)

	/* Define our RESTful routes for tracer events. Tracer events are indexed by their
	 * corresponding tracer ID. */
	RestRouter.Methods("POST").Path("/tracers/{tracerID}/events").HandlerFunc(AddEvent)
	RestRouter.Methods("GET").Path("/tracers/{tracerID}/events").HandlerFunc(GetEvents)
	RestRouter.Methods("POST").Path("/tracers/events/bulk").HandlerFunc(AddEvents)

	/* Define RESTful routes for labels. */
	RestRouter.Methods("POST").Path("/labels").HandlerFunc(AddLabel)
	RestRouter.Methods("GET").Path("/labels").HandlerFunc(GetLabels)
	RestRouter.Methods("GET").Path("/labels/{labelID}").HandlerFunc(GetLabel)

	/* The base application page. Don't use the compiled assets unless in production. */
	if configure.DebugUI || flag.Lookup("test.v") != nil {
		RestRouter.PathPrefix("/").Handler(http.FileServer(http.Dir("./tracer/view/build")))
	} else {
		RestRouter.PathPrefix("/").Handler(http.FileServer(assetFS()))
	}

	/* Define routes for config. */
	ConfigRouter.Methods("GET").Path("/config").HandlerFunc(GetConfig)

	/* Create the server. */
	addr, err := configure.ReadConfig("tracer-server")

	if err != nil {
		log.Error.Fatal(err)
	} else {
		corsOptions := []handlers.CORSOption{
			handlers.AllowedOriginValidator(func(a string) bool {
				return true
			})}

		//Additional server features rest server
		restHandler := handlers.CompressHandlerLevel(RestRouter, gzip.BestCompression)
		restHandler = handlers.CORS(corsOptions...)(restHandler)
		restHandler = applicationJSONMiddleware(restHandler)
		restHandler = cacheMiddleware(restHandler)

		RestServer = &http.Server{
			Handler: restHandler,
			Addr:    addr.(string),
			// Good practice: enforce timeouts for servers you create!
			WriteTimeout: 15 * time.Second,
			ReadTimeout:  15 * time.Second,
			ErrorLog:     log.Error,
		}

		//Additional server features for configuration server
		configHandler := handlers.CompressHandlerLevel(ConfigRouter, gzip.BestCompression)
		configHandler = handlers.CORS(corsOptions...)(configHandler)
		configHandler = applicationJSONMiddleware(configHandler)
		configHandler = cacheMiddleware(configHandler)

		ConfigServer = &http.Server{
			Handler: configHandler,
			Addr:    "127.0.0.1:6001", // hardcoded configuration server so the web client knows where to get the configuration settings from
			// Good practice: enforce timeouts for servers you create!
			WriteTimeout: 15 * time.Second,
			ReadTimeout:  15 * time.Second,
			ErrorLog:     log.Error,
		}
	}
}

/* Helper for adding application/json content type to all APIs. */
func applicationJSONMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

/* Helper for adding caching to get requests that haven't changed. */
func cacheMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rec := httptest.NewRecorder()
		next.ServeHTTP(rec, r)

		// We copy the original headers first.
		for k, v := range rec.Header() {
			w.Header()[k] = v
		}

		// Only want to cache response request by HTTP GET requests.
		body := rec.Body.Bytes()
		if r.Method == http.MethodGet {
			// Check if the request is cached
			eTagHash := r.Header.Get("If-None-Match")
			sum := sha1.Sum(body)
			sumStr := hex.EncodeToString(sum[:len(sum)])
			if eTagHash != "" {
				if eTagHash == sumStr {
					w.Header().Set("Cache-Control", "no-cache")
					w.WriteHeader(http.StatusNotModified)
					w.Write([]byte(""))
				} else {
					w.Header().Set("Cache-Control", "no-cache")
					w.Header().Set("Etag", sumStr)
					w.WriteHeader(rec.Code)
					w.Write(body)
				}
			} else {
				w.Header().Set("Cache-Control", "no-cache")
				w.Header().Set("Etag", sumStr)
				w.WriteHeader(rec.Code)
				w.Write(body)
			}
		} else {
			w.WriteHeader(rec.Code)
			w.Write(body)
		}
	})
}
