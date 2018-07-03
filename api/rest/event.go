package rest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/nccgroup/tracy/api/common"
	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/log"

	"github.com/gorilla/mux"
)

// addEventHelper is used by AddEvent and AddEvents to add an event to the tracer
// specified. It returns the HTTP status and the return value.
func addEventHelper(tracer types.Tracer, tracerEvent types.TracerEvent) (int, []byte) {
	tracerEvent.TracerID = tracer.ID
	status := http.StatusOK
	ret, err := common.AddEvent(tracer, tracerEvent)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			status = http.StatusConflict
		} else {
			status = http.StatusInternalServerError
			log.Error.Print(err)
		}
	}

	return status, ret
}

// AddEvent adds a tracer event to the tracer specified in the URL.
func AddEvent(w http.ResponseWriter, r *http.Request) {
	var tracerEvent types.TracerEvent
	if err := json.NewDecoder(r.Body).Decode(&tracerEvent); err != nil {
		returnError(w, err)
		return
	}

	rawEvent, err := common.AddEventData(tracerEvent.RawEvent.Data)
	if err != nil {
		returnError(w, err)
		return
	}

	vars := mux.Vars(r)
	tracerIDs, ok := vars["tracerID"]
	if !ok {
		returnError(w, fmt.Errorf("No tracerID variable found in the path"))
		return
	}

	tracerEvent.RawEventID = rawEvent.ID
	tracerEvent.RawEvent = rawEvent
	tracerID, err := strconv.ParseUint(tracerIDs, 10, 32)
	if err != nil {
		returnError(w, err)
		return
	}

	var tracer types.Tracer
	if err := store.DB.First(&tracer, "id = ?", tracerID).Error; err != nil {
		returnError(w, err)
		return
	}

	status, ret := addEventHelper(tracer, tracerEvent)
	w.WriteHeader(status)
	w.Write(ret)
}

// GetEvents gets all the events associated with a tracer ID.
func GetEvents(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tracerID, err := strconv.ParseUint(vars["tracerID"], 10, 32)
	if err != nil {
		returnError(w, err)
		return
	}

	ret, err := common.GetEvents(uint(tracerID))
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}

// AddEvents adds multiple tracer events to the tracer specified in the URL.
func AddEvents(w http.ResponseWriter, r *http.Request) {
	var bulkTracerEvent []types.TracerEventBulk
	if err := json.NewDecoder(r.Body).Decode(&bulkTracerEvent); err != nil {
		returnError(w, err)
		return
	}

	var (
		// Count the number of successful events that were added.
		count       uint
		finalStatus = http.StatusOK
		finalRet    []byte
		rawEvent    types.RawEvent
		err         error
	)
	for _, tracerEvent := range bulkTracerEvent {
		if rawEvent, err = common.AddEventData(tracerEvent.TracerEvent.RawEvent.Data); err != nil {
			log.Error.Print(err)
			continue
		}

		tracerEvent.TracerEvent.RawEventID = rawEvent.ID
		tracerEvent.TracerEvent.RawEvent = rawEvent

		// For each of the tracer strings that were found in the DOM event, find
		// the tracer they are associated with and add an event to it.
		for _, tracerPayload := range tracerEvent.TracerPayloads {
			var tracer types.Tracer
			if err = store.DB.First(&tracer, "tracer_payload = ?", tracerPayload).Error; err != nil {
				// If there was an error getting the tracer, fail fast and continue
				// to the next one.
				log.Error.Println(err)
				continue
			}
			// Add the tracer event.
			status, ret := addEventHelper(tracer, tracerEvent.TracerEvent)

			// If any of them fail, the whole request status fails.
			if status == http.StatusInternalServerError {
				finalStatus = http.StatusInternalServerError
				// Only returns the error for the last failed event addition.
				finalRet = []byte(fmt.Sprintf("{\"Status\": \"%s\":}", ret))
			} else if status == http.StatusConflict && finalStatus != http.StatusInternalServerError {
				finalStatus = http.StatusConflict
				finalRet = []byte(fmt.Sprintf("{\"Status\": \"%s\":}", ret))
			} else {
				count++
			}
		}

	}

	if len(finalRet) == 0 {
		finalRet = []byte(fmt.Sprintf(`{"Status":"Success", "Count":"%d"}`, count))
	}

	w.WriteHeader(finalStatus)
	w.Write(finalRet)
}
