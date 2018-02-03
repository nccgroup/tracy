package rest

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"net/http"
	"strconv"
	"strings"
	"tracy/log"
	"tracy/tracer/common"
	"tracy/tracer/store"
	"tracy/tracer/types"
)

/* Helper function used by AddEvent and AddEvents to add an event to the tracer specified.
 * Returns the HTTP status and the return value. */
func addEventHelper(trcrID uint, trcrEvnt types.TracerEvent) (int, []byte) {
	log.Trace.Printf("Adding a tracer event: %+v, tracerID: %d", trcrEvnt, trcrID)
	status := http.StatusInternalServerError
	var ret []byte
	var err error
	if ret, err = common.AddEvent(trcrID, trcrEvnt); err != nil {
		log.Error.Println(err)
		if strings.Contains(err.Error(), "UNIQUE") {
			status = http.StatusConflict
		}
		fmt.Printf("Error: %+v", err)
	} else {
		fmt.Printf("Here (ret): %+v", string(ret))
		log.Trace.Printf("Successfully added the tracer event: %v", string(ret))
		status = http.StatusOK
	}

	return status, ret
}

/*AddEvent adds a tracer event to the tracer specified in the URL. */
func AddEvent(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError
	vars := mux.Vars(r)
	tracerEvent := types.TracerEvent{}
	if err := json.NewDecoder(r.Body).Decode(&tracerEvent); err == nil {
		/* Add the tracer event. */
		var tracerID uint64
		if tracerID, err = strconv.ParseUint(vars["tracerID"], 10, 32); err == nil {
			log.Trace.Printf("Parsed the following tracer ID from the route: %d", tracerID)
			status, ret = addEventHelper(uint(tracerID), tracerEvent)
		}
	}

	w.WriteHeader(status)
	w.Write(ret)
}

/*GetEvents gets all the events associated with a tracer ID. */
func GetEvents(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	vars := mux.Vars(r)
	status := http.StatusInternalServerError

	if tracerID, err := strconv.ParseUint(vars["tracerID"], 10, 32); err == nil {
		if ret, err = common.GetEvents(uint(tracerID)); err != nil {
			ret = ServerError(err)
			log.Error.Println(err)
		} else {
			status = http.StatusOK
		}
	}

	w.WriteHeader(status)
	w.Write(ret)
}

/*AddEvents adds multiple tracer events to the tracer specified in the URL. */
func AddEvents(w http.ResponseWriter, r *http.Request) {
	finalStatus := http.StatusOK
	finalRet := make([]byte, 0)
	bulkTracerEvent := []types.TracerEventBulk{}
	log.Trace.Printf("Adding tracer events: %+v", bulkTracerEvent)
	json.NewDecoder(r.Body).Decode(&bulkTracerEvent)

	/* Count the number of successful events that were added. */
	count := 0

	for _, tracerEvent := range bulkTracerEvent {
		/* For each of the tracer strings that were found in the DOM event, find the tracer they are associated with
		 * and add an event to it. */
		for _, tracerString := range tracerEvent.TracerStrings {
			var tracer types.Tracer
			if err := store.DB.First(&tracer, "tracer_string = ?", tracerString).Error; err != nil {
				/* If there was an error getting the tracer, fail fast and continue to the next one. */
				log.Error.Println(err)
				continue
			}
			/* Add the tracer event. */
			status, ret := addEventHelper(tracer.ID, tracerEvent.TracerEvent)

			/* If any of them fail, the whole request status fails. */
			if status == http.StatusInternalServerError {
				finalStatus = http.StatusInternalServerError
				/* Only returns the error for the last failed event addition. */
				finalRet = []byte(fmt.Sprintf("{\"Status\": \"%s\":}", ret))
			} else if status == http.StatusConflict && finalStatus != http.StatusInternalServerError {
				finalStatus = http.StatusConflict
				finalRet = []byte(fmt.Sprintf("{\"Status\": \"%s\":}", ret))
			} else {
				count = count + 1
			}
		}
	}

	if len(finalRet) == 0 {
		finalRet = []byte(fmt.Sprintf(`{"Status":"Success", "Count":"%d"}`, count))
	}

	w.WriteHeader(finalStatus)
	w.Write(finalRet)
}
