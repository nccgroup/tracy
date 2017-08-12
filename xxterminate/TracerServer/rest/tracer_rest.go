package rest

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"log"
	"net/http"
	"strconv"
	"xxterminator-plugin/xxterminate/TracerServer/store"
	"xxterminator-plugin/xxterminate/TracerServer/types"
)

/*AddTracer Add a new tracer to the database. */
func AddTracer(w http.ResponseWriter, r *http.Request) {
	in := types.Tracer{}
	json.NewDecoder(r.Body).Decode(&in)
	log.Printf("Adding a tracer: %+v\n", in)

	trcr, err := store.DBAddTracer(store.TracerDB, in)
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

/*DeleteTracer Delete an existing tracer using the ID in the URL. */
func DeleteTracer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerId"]; ok {
		log.Printf("Deleting the following tracer: %d\n", trcrID)
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		err = store.DBDeleteTracer(store.TracerDB, int(id))
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

/*EditTracer Alter an existing tracer using the ID in the URL. */
func EditTracer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerId"]; ok {
		log.Printf("Editing the following tracer: %d\n", trcrID)
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		tmp := types.Tracer{}
		json.NewDecoder(r.Body).Decode(&tmp)
		trcr, err := store.DBEditTracer(store.TracerDB, int(id), tmp)
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

/*GetTracers Get all the tracer data structures. */
func GetTracers(w http.ResponseWriter, r *http.Request) {
	tracers, err := store.DBGetTracers(store.TracerDB)
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

/*GetTracer Get the tracer data structure belonging to the ID in the URL. */
func GetTracer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerId"]; ok {
		log.Printf("Getting the following tracer: %s\n", trcrID)
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			log.Printf(err.Error())
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		trcr, err := store.DBGetTracerByID(store.TracerDB, int(id))
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
