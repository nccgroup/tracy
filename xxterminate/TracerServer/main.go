package main

import (
	"github.com/gorilla/mux"
	"io/ioutil"
	"log"
	"net/http"
	"path"
	"path/filepath"
	"runtime"
	"time"
	"xxterminator-plugin/xxterminate/TracerServer/rest"
	"xxterminator-plugin/xxterminate/TracerServer/store"
)

func main() {
	/* Configure the server, but we won't need the router. */
	srv, _ := configureServer()

	/* Serve it. */
	log.Fatal(srv.ListenAndServe())
}

func init() {
	openDatabase()
}

/* The base route for the application. */
func root(w http.ResponseWriter, r *http.Request) {
	body, _ := ioutil.ReadFile("index.html")
	w.Write(body)
}

/* Configuration for all application routes. */
func configureServer() (*http.Server, *mux.Router) {
	/* Define our RESTful routes for tracers. Tracers are indexed by their database ID. */
	r := mux.NewRouter()
	r.Methods("POST").Path("/tracers").HandlerFunc(rest.AddTracer)
	r.Methods("DELETE").Path("/tracers/{tracerId}").HandlerFunc(rest.DeleteTracer)
	r.Methods("PUT").Path("/tracers/{tracerId}").HandlerFunc(rest.EditTracer)
	r.Methods("GET").Path("/tracers/{tracerId}").HandlerFunc(rest.GetTracer)
	r.Methods("GET").Path("/tracers").HandlerFunc(rest.GetTracers)

	/* Define our RESTful routes for tracer events. Tracer events are indexed by their
	 * corresponding tracer ID. */
	r.Methods("POST").Path("/tracers/{tracerId}/events").HandlerFunc(rest.AddEvent)

	/* The base application page. */
	r.Methods("GET").Path("/").HandlerFunc(root)

	/* Create the server. */
	srv := &http.Server{
		Handler: r,
		Addr:    "127.0.0.1:8081",
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	/* Return the server and the router. The router is mainly used for testing. */
	return srv, r
}

func openDatabase() {
	/* TODO: make this configurable. */
	/* Find the path of this package. */
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		log.Fatal("No caller information, therefore, can't find the database.")
	}
	/* Should be something like $GOPATH/src/xxterminator-plugin/xxtermiate/TracerServer/store/tracer-db.db */
	db := path.Dir(filename) + string(filepath.Separator) + "store" + string(filepath.Separator) + "tracer-db.db"

	/* Open the database file. */
	var err error
	_, err = store.Open("sqlite3", db)
	if err != nil {
		/* Can't really recover here. We need the database. */
		log.Fatal(err)
	}
}
