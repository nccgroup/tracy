package main

import (
	"Windy/websocket"
	"database/sql"
	"encoding/json"
	"github.com/gorilla/mux"
	"io/ioutil"
	"log"
	"net/http"
	"path"
	"path/filepath"
	"runtime"
	"strings"
	"time"
	"xxterminator-plugin/xxterminate/TracerServer/store"
	"xxterminator-plugin/xxterminate/TracerServer/tracer"
	"fmt"
	"strconv"
)

/* Add a new tracer to the database. */
func addTracer(w http.ResponseWriter, r *http.Request) {
	temp := tracer.Tracer{}
	json.NewDecoder(r.Body).Decode(&temp)
	log.Printf("Adding a tracer: %+v\n", temp)

	trcr, err := store.AddTracer(TracerDB, temp)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}

	trcr_str, err := json.Marshal(trcr)
	if err != nil {
		log.Printf(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	w.Write(trcr_str)
}

/* Delete an existing tracer using the ID in the URL. */
func deleteTracer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if trcr_id, ok := vars["tracer_id"]; ok {
		log.Printf("Deleting the following tracer: %d\n", trcr_id)
		id, err := strconv.ParseInt(trcr_id, 10, 32)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		err = store.DeleteTracer(TracerDB, int(id))
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		/* Delete was successful. Return a 202 and the ID that was deleted. */
		w.WriteHeader(http.StatusAccepted)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(fmt.Sprintf(`{"id": "%s", "status": "deleted"}`, trcr_id)))
	} 
}

/* Alter an existing tracer using the ID in the URL. */
func editTracer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if trcr_id, ok := vars["tracer_id"]; ok {
		log.Printf("Editing the following tracer: %d\n", trcr_id)
		temp := tracer.TracerEvent{}
		json.NewDecoder(r.Body).Decode(&temp)

		select {
		case realTime <- temp: //This is so it does not block Note: only one person will get this for now

		}

		/* TODO: as of right now, this doesn't make sense. Need a way for this request to
		 * know what event this triggered for. */
		store.AddTracerEvent(TracerDB, temp, []string{})
	} //TODO: websocket code can go here
}

/* Get all the tracer data structures. */
func getTracers(w http.ResponseWriter, r *http.Request) {
	tracers, err := store.GetTracers(TracerDB)
	if err != nil {
		log.Printf(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	tracerInfo, err := json.Marshal(tracers)

	if err != nil {
		log.Printf(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.Write(tracerInfo)
}

/* Get the tracer data structure belonging to the ID in the URL. */
func getTracer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if trcr_id, ok := vars["tracer_id"]; ok {
		log.Printf("Adding the following tracer: %s\n", trcr_id)
		id, err := strconv.ParseInt(trcr_id, 10, 32)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		trcr, err := store.GetTracerById(TracerDB, int(id))
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		tracerInfo, err := json.Marshal(trcr)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		/* If we got no users, make the response code 204. */
		if trcr.ID == 0 {
			w.WriteHeader(http.StatusNoContent)
		} else {
			w.WriteHeader(http.StatusOK)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(tracerInfo)
	} //TODO: websocket code can go here
}

func realTimeServer(ws *websocket.Conn) {
	for event := range realTime {
		eventJSON, _ := json.Marshal(event)
		ws.Write(eventJSON)
	}
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
	r.Methods("POST").Path("/tracers").HandlerFunc(addTracer)
	r.Methods("DELETE").Path("/tracers/{tracer_id}").HandlerFunc(deleteTracer)
	r.Methods("PUT").Path("/tracers/{tracer_id}").HandlerFunc(editTracer)
	r.Methods("GET").Path("/tracers/{tracer_id}").HandlerFunc(getTracer)
	r.Methods("GET").Path("/tracers").HandlerFunc(getTracers)

	/* The base application page. */
	r.Methods("GET").Path("/").HandlerFunc(root)

	/* TODO: The websocket server. */
	//r.Methods("GET").Path("/tracers/ws").HandlerFunc(websocket.Handler(realTimeServer))

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

var TracerDB *sql.DB
var realTime chan tracer.TracerEvent

func main() {
	/* Configure the server, but we won't need the router. */
	srv, _ := configureServer()

	/* Serve it. */
	log.Fatal(srv.ListenAndServe())
}

func openDatabase() {
	/* TODO: make this configurable. */
	/* Find the path of this package. */
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		log.Fatal("No caller information, therefore, can't find the database.")
	}
	/* Should be something like $GOPATH/src/xxterminator-plugin/xxtermiate/TracerServer/store/tracer-db.db */
	db_loc := path.Dir(filename) + string(filepath.Separator) + "store" + string(filepath.Separator) + "tracer-db.db"

	realTime = make(chan tracer.TracerEvent, 10)

	/* Open the database file. */
	var err error
	TracerDB, err = store.Open("sqlite3", db_loc)
	if err != nil {
		/* Can't really recover here. We need the database. */
		log.Fatal(err)
	}
}

func init() {
	openDatabase()
}
