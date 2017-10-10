package configure

import (
	"fmt"
	"github.com/gorilla/mux"
	"net/http"
	"os"
	"time"
	"xxterminator-plugin/log"
	"xxterminator-plugin/tracer/rest"
	"xxterminator-plugin/tracer/store"
)

/* TODO: make configurable. */
var TracerServer = "127.0.0.1:8081"

/*Server configures all the HTTP routes and their corresponding handler. */
func Server() (*http.Server, *mux.Router) {
	/* Define our RESTful routes for tracers. Tracers are indexed by their database ID. */
	r := mux.NewRouter()
	r.Methods("POST").Path("/tracers").HandlerFunc(rest.AddTracer)
	r.Methods("DELETE").Path("/tracers/{tracerID}").HandlerFunc(rest.DeleteTracer)
	r.Methods("PUT").Path("/tracers/{tracerID}").HandlerFunc(rest.EditTracer)

	r.Methods("GET").Path("/tracers/events").HandlerFunc(rest.GetTracersWithEvents)
	r.Methods("GET").Path("/tracers/{tracerID}").HandlerFunc(rest.GetTracer)
	r.Methods("GET").Path("/tracers").HandlerFunc(rest.GetTracers)

	/* Define our RESTful routes for tracer events. Tracer events are indexed by their
	 * corresponding tracer ID. */
	r.Methods("POST").Path("/tracers/{tracerID}/events").HandlerFunc(rest.AddEvent)
	r.Methods("POST").Path("/tracers/events/bulk").HandlerFunc(rest.AddEvents)

	/* The base application page. */
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./tracer/view/xxterminate/build/")))
	/* Create the server. */
	srv := &http.Server{
		Handler: r,
		Addr:    TracerServer,
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	/* Return the server and the router. The router is mainly used for testing. */
	return srv, r
}

/*Database opens the database from the store package. The resultant DB is available
 * via the TracerDB global. */
func Database(db string) {
	/* Open the database file. */
	_, err := store.Open("sqlite3", db)
	if err != nil {
		/* Can't really recover here. We need the database. */
		log.Error.Fatal(err)
	}
}

/*DeleteDatabase deletes the database at the file path specified. */
func DeleteDatabase(db string) error {
	var ret error

	/* If the database exists, remove it. It will affect the test. */
	if _, err := os.Stat(db); !os.IsNotExist(err) {
		err := os.Remove(db)
		if err != nil {
			ret = fmt.Errorf("wasn't able to delete the database at: %s", db)
		}
	}

	return ret
}
