package main

import (
	"Windy/websocket"
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"io/ioutil"
	"log"
	"net/http"
	"path"
	"path/filepath"
	"runtime"
	"strconv"
	"time"
	"xxterminator-plugin/xxterminate/TracerServer/store"
	"xxterminator-plugin/xxterminate/TracerServer/tracer"
)

/* Add a new tracer to the database. */
func addTracer(w http.ResponseWriter, r *http.Request) {
	in := tracer.Tracer{}
	json.NewDecoder(r.Body).Decode(&in)
	log.Printf("Adding a tracer: %+v\n", in)

	trcr, err := store.AddTracer(tracerDB, in)
	if err != nil {
		log.Printf(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	trcrStr, err := json.Marshal(trcr)
	if err != nil {
		log.Printf(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	w.Write(trcrStr)
}

/* Delete an existing tracer using the ID in the URL. */
func deleteTracer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerId"]; ok {
		log.Printf("Deleting the following tracer: %d\n", trcrID)
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		err = store.DeleteTracer(tracerDB, int(id))
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		/* Delete was successful. Return a 202 and the ID that was deleted. */
		w.WriteHeader(http.StatusAccepted)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(fmt.Sprintf(`{"id": "%s", "status": "deleted"}`, trcrID)))
	}
}

/* Alter an existing tracer using the ID in the URL. */
func editTracer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerId"]; ok {
		log.Printf("Editing the following tracer: %d\n", trcrID)
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		tmp := tracer.Tracer{}
		json.NewDecoder(r.Body).Decode(&tmp)
		trcr, err := store.EditTracer(tracerDB, int(id), tmp)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		trcrStr, err := json.Marshal(trcr)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		w.WriteHeader(http.StatusCreated)
		w.Header().Set("Content-Type", "application/json")
		w.Write(trcrStr)
	} //TODO: websocket code can go here
}

/* Get all the tracer data structures. */
func getTracers(w http.ResponseWriter, r *http.Request) {
	tracers, err := store.GetTracers(tracerDB)
	if err != nil {
		log.Printf(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	tracerInfo, err := json.Marshal(tracers)

	if err != nil {
		log.Printf(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	w.Write(tracerInfo)
}

/* Get the tracer data structure belonging to the ID in the URL. */
func getTracer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerId"]; ok {
		log.Printf("Getting the following tracer: %s\n", trcrID)
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		trcr, err := store.GetTracerById(tracerDB, int(id))
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

/* Add a tracer event to the tracer specified in the URL. */
func addEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerId"]; ok {
		tmp := tracer.TracerEvent{}
		json.NewDecoder(r.Body).Decode(&tmp)
		/* Validate the event before uploading it to the database. */
		if tmp.Data.String != "" {
			err := "The data field for the event was empty"
			log.Printf(err)
			http.Error(w, err, http.StatusInternalServerError)
		}
		if tmp.Location.String != "" {
			err := "The location field for the event was empty"
			log.Printf(err)
			http.Error(w, err, http.StatusInternalServerError)
		}
		if tmp.EventType.String != "" {
			err := "The event type field for the event was empty"
			log.Printf(err)
			http.Error(w, err, http.StatusInternalServerError)
		}

		log.Printf("Adding a tracer event: %+v\n", tmp)
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		/* Look up the tracer based on the provided ID. */
		trcr, err := store.GetTracerById(tracerDB, int(id))
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		/* Make sure the ID of the tracer exists. */
		if trcr.ID == 0 {
			err := fmt.Sprintf("The tracer ID %s doesn't exist", trcrID)
			http.Error(w, err, http.StatusNotFound)
		}

		/* If it is a valid tracer event and the tracer exists, then add it to the database. */
		event, err := store.AddTracerEvent(tracerDB, tmp, []string{trcr.TracerString})
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		eventStr, err := json.Marshal(event)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		w.Write(eventStr)
	}
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
	r.Methods("DELETE").Path("/tracers/{tracerId}").HandlerFunc(deleteTracer)
	r.Methods("PUT").Path("/tracers/{tracerId}").HandlerFunc(editTracer)
	r.Methods("GET").Path("/tracers/{tracerId}").HandlerFunc(getTracer)
	r.Methods("GET").Path("/tracers").HandlerFunc(getTracers)

	/* Define our RESTful routes for tracer events. Tracer events are indexed by their
	 * corresponding tracer ID. */
	r.Methods("POST").Path("/tracers/{tracerId}/events").HandlerFunc(addEvent)

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

var tracerDB *sql.DB
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
	db := path.Dir(filename) + string(filepath.Separator) + "store" + string(filepath.Separator) + "tracer-db.db"

	realTime = make(chan tracer.TracerEvent, 10)

	/* Open the database file. */
	var err error
	tracerDB, err = store.Open("sqlite3", db)
	if err != nil {
		/* Can't really recover here. We need the database. */
		log.Fatal(err)
	}
}

func init() {
	openDatabase()
}
