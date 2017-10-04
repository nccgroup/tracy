package rest

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"log"
	"net/http"
	"strconv"
	"xxterminator-plugin/tracer/common"
	"xxterminator-plugin/tracer/types"
)

/*AddEvent adds a tracer event to the tracer specified in the URL. */
func AddEvent(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError
	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerId"]; ok {
		trcrEvnt := types.TracerEvent{}
		json.NewDecoder(r.Body).Decode(&trcrEvnt)
		/* Validate the event before uploading it to the database. */
		if trcrEvnt.Data.String == "" {
			errStr := "The data field for the event was empty"
			log.Printf(errStr)
			http.Error(w, errStr, http.StatusInternalServerError)
		} else if trcrEvnt.Location.String == "" {
			errStr := "The location field for the event was empty"
			log.Printf(errStr)
			http.Error(w, errStr, http.StatusInternalServerError)
		} else if trcrEvnt.EventType.String == "" {
			errStr := "The event type field for the event was empty"
			log.Printf(errStr)
			http.Error(w, errStr, http.StatusInternalServerError)
		} else {
			id, err := strconv.ParseInt(trcrID, 10, 32)
			if err != nil {
				log.Printf(err.Error())
				http.Error(w, err.Error(), http.StatusInternalServerError)
			} else {
				evntStr, err := common.AddEvent(int(id), trcrEvnt)
				if err != nil {
					log.Printf(err.Error())
					http.Error(w, err.Error(), http.StatusInternalServerError)
				} else {
					/* Final success case. */
					status = http.StatusOK
					ret = evntStr
				}
			}
		}
	}

	w.WriteHeader(status)
	w.Header().Set("Content-Type", "application/json")
	w.Write(ret)
}
