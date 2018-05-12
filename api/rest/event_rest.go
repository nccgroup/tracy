package rest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"tracy/api/common"
	"tracy/api/store"
	"tracy/api/types"
	"tracy/log"

	"github.com/gorilla/mux"
)

/* Helper function used by AddEvent and AddEvents to add an event to the tracer specified.
 * Returns the HTTP status and the return value. */
func addEventHelper(tracer types.Tracer, tracerEvent types.TracerEvent) (int, []byte) {
	tracerEvent.TracerID = tracer.ID
	log.Error.Printf("Adding a tracer event: %d", tracerEvent.ID)
	status := http.StatusInternalServerError
	var ret []byte
	var err error
	if ret, err = common.AddEvent(tracer, tracerEvent); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			status = http.StatusConflict
		} else {
			log.Error.Println(err)
		}
	} else {
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
		log.Trace.Printf("Parsed the following tracer from the request: %+v", tracerEvent)
		/* Add tracer event data*/
		rawEvent := common.AddEventData(tracerEvent.RawEvent.Data)
		tracerEvent.RawEventID = rawEvent.ID

		/* Add the tracer event. */
		var tracerID uint64
		if tracerID, err = strconv.ParseUint(vars["tracerID"], 10, 32); err == nil {
			log.Trace.Printf("Parsed the following tracer ID from the route: %d", tracerID)
			tracer := types.Tracer{}
			tracer.ID = uint(tracerID)
			status, ret = addEventHelper(tracer, tracerEvent)
		}
	} else {
		log.Error.Println(err)
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
	} else {
		log.Error.Println(err)
	}

	w.WriteHeader(status)
	w.Write(ret)
}

/*AddEvents adds multiple tracer events to the tracer specified in the URL. */
func AddEvents(w http.ResponseWriter, r *http.Request) {
	finalStatus := http.StatusOK
	finalRet := make([]byte, 0)
	bulkTracerEvent := []types.TracerEventBulk{}
	if err := json.NewDecoder(r.Body).Decode(&bulkTracerEvent); err == nil {
		log.Error.Printf("Adding tracer events: %+v", bulkTracerEvent)

		/* Count the number of successful events that were added. */
		count := 0

		for _, tracerEvent := range bulkTracerEvent {
			rawEvent := common.AddEventData(tracerEvent.TracerEvent.RawEvent.Data)
			tracerEvent.TracerEvent.RawEventID = rawEvent.ID
			tracerEvent.TracerEvent.RawEvent = rawEvent

			/* For each of the tracer strings that were found in the DOM event, find the tracer they are associated with
			 * and add an event to it. */
			for _, tracerPayload := range tracerEvent.TracerPayloads {
				var tracer types.Tracer
				if err := store.DB.First(&tracer, "tracer_payload = ?", tracerPayload).Error; err != nil {
					/* If there was an error getting the tracer, fail fast and continue to the next one. */
					log.Error.Println(err)
					continue
				}
				/* Add the tracer event. */
				status, ret := addEventHelper(tracer, tracerEvent.TracerEvent)

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
	} else {
		finalStatus = http.StatusInternalServerError
		log.Error.Println(err)
	}

	w.WriteHeader(finalStatus)
	w.Write(finalRet)
}
