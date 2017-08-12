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

/*AddEvent Add a tracer event to the tracer specified in the URL. */
func AddEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerId"]; ok {
		tmp := types.TracerEvent{}
		json.NewDecoder(r.Body).Decode(&tmp)
		/* Validate the event before uploading it to the database. */
		if tmp.Data.String == "" {
			err := "The data field for the event was empty"
			log.Printf(err)
			http.Error(w, err, http.StatusInternalServerError)
		}
		if tmp.Location.String == "" {
			err := "The location field for the event was empty"
			log.Printf(err)
			http.Error(w, err, http.StatusInternalServerError)
		}
		if tmp.EventType.String == "" {
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
		trcr, err := store.DBGetTracerByID(store.TracerDB, int(id))
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
		event, err := store.DBAddTracerEvent(store.TracerDB, tmp, []string{trcr.TracerString})
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
