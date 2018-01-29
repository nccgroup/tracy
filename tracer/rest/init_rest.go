package rest

import (
	"github.com/gorilla/mux"
	"net/http"
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

/*Helper that configures all the HTTP routes and their corresponding handler. */
func init() {
	RestRouter = mux.NewRouter()
	ConfigRouter = mux.NewRouter()
	/* Define our RESTful routes for tracers. Tracers are indexed by their database ID. */
	RestRouter.Methods("POST").Path("/tracers").HandlerFunc(AddTracer)
	RestRouter.Methods("DELETE").Path("/tracers/{tracerID}").HandlerFunc(DeleteTracer)
	RestRouter.Methods("PUT").Path("/tracers/{tracerID}").HandlerFunc(EditTracer)
	RestRouter.Methods("GET").Path("/tracers/generate").HandlerFunc(GenerateTracer)

	RestRouter.Methods("GET").Path("/tracers/events").HandlerFunc(GetTracersWithEvents)
	RestRouter.Methods("GET").Path("/tracers/{tracerID}").HandlerFunc(GetTracer)
	RestRouter.Methods("GET").Path("/tracers").HandlerFunc(GetTracers)

	/* Define our RESTful routes for tracer events. Tracer events are indexed by their
	 * corresponding tracer ID. */
	RestRouter.Methods("POST").Path("/tracers/{tracerID}/events").HandlerFunc(AddEvent)
	RestRouter.Methods("POST").Path("/tracers/events/bulk").HandlerFunc(AddEvents)

	/* Define RESTful routes for labels. */
	RestRouter.Methods("POST").Path("/labels").HandlerFunc(AddLabel)
	RestRouter.Methods("GET").Path("/labels").HandlerFunc(GetLabels)
	RestRouter.Methods("GET").Path("/labels/{labelID}").HandlerFunc(GetLabel)

	/* The base application page. */
	RestRouter.PathPrefix("/").Handler(http.FileServer(assetFS()))

	/* Define routes for config. */
	ConfigRouter.Methods("GET").Path("/config").HandlerFunc(GetConfig)

	/* Create the server. */
	addr, err := configure.ReadConfig("tracer-server")

	if err != nil {
		log.Error.Fatal(err)
	} else {
		RestServer = &http.Server{
			Handler: RestRouter,
			Addr:    addr.(string),
			// Good practice: enforce timeouts for servers you create!
			WriteTimeout: 15 * time.Second,
			ReadTimeout:  15 * time.Second,
			ErrorLog: log.Error,
		}

		ConfigServer = &http.Server{
			Handler: ConfigRouter,
			Addr:    "127.0.0.1:6001", // hardcoded configuration server so the web client knows where to get the configuration settings from
			// Good practice: enforce timeouts for servers you create!
			WriteTimeout: 15 * time.Second,
			ReadTimeout:  15 * time.Second,
			ErrorLog: log.Error,
		}
	}
}
