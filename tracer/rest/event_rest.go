package rest

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"xxterminator-plugin/log"
	"net/http"
	"strconv"
	"xxterminator-plugin/tracer/common"
	"xxterminator-plugin/tracer/types"
	"fmt"
)

/* Helper function used by AddEvent and AddEvents to add an event to the tracer specified.
 * Returns the HTTP status and the return value. */
func addEventHelper(vars map[string]string, trcrEvnt types.TracerEvent) (int, []byte) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	if trcrID, ok := vars["tracerId"]; ok {
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			ret = []byte("The tracer ID was not a valid integer")
			log.Error.Println(err)
		} else {
			/* Validate the event before uploading it to the database. */
			if trcrEvnt.Data.String == "" {
				ret = []byte("The data field for the event was empty")
				log.Error.Println(ret)
			} else if trcrEvnt.Location.String == "" {
				ret = []byte("The location field for the event was empty")
				log.Error.Println(ret)
			} else if trcrEvnt.EventType.String == "" {
				ret = []byte("The event type field for the event was empty")
				log.Error.Println(ret)
			} else {
				evntStr, err := common.AddEvent(int(id), trcrEvnt)
				if err != nil {
					ret = []byte("There was an error adding the event.")
					log.Error.Println(err)
				} else {
					/* Final success case. */
					status = http.StatusOK
					ret = evntStr
				}
			}
		}

	}

	return status, ret
}

/*AddEvent adds a tracer event to the tracer specified in the URL. */
func AddEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	trcrEvnt := types.TracerEvent{}
	json.NewDecoder(r.Body).Decode(&trcrEvnt)

	/* Add the tracer event. */
	status, ret := addEventHelper(vars, trcrEvnt)

	w.WriteHeader(status)
	w.Header().Set("Content-Type", "application/json")
	w.Write(ret)
}

/*AddEvents adds multiple tracer events to the tracer specified in the URL. */
func AddEvents(w http.ResponseWriter, r *http.Request) {
	finalStatus := http.StatusOK
	finalRet := []byte(fmt.Sprintf(`{"Status":"Success", "Count":"%d"}`, 0))
	vars := mux.Vars(r)
	trcrEvnts := make([]types.TracerEvent, 0)
	json.NewDecoder(r.Body).Decode(&trcrEvnts)

	log.Trace.Printf("Decoded the following tracer events: %+v", trcrEvnts)

	/* Count the number of successful events that were added. */
	count := 0

	for _, v := range trcrEvnts {
		/* Add the tracer event. */
		status, ret := addEventHelper(vars, v)

		/* If any of them fail, the whole request status fails. */
		if status == http.StatusInternalServerError {
			finalStatus = http.StatusInternalServerError
			/* Only returns the error for the last failed event addition. */
			finalRet = []byte(fmt.Sprintf(`{"Status":"Internal Server Error", "Error":"%s"}`, ret))
		} else {
			count++
		}
	}

	w.WriteHeader(finalStatus)
	w.Header().Set("Content-Type", "application/json")
	w.Write(finalRet)
}
