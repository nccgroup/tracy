package rest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/nccgroup/tracy/api/common"
	"github.com/nccgroup/tracy/api/types"
)

// StartReproductions handles the HTTP API request for starting a
// reproduction for a particular tracer and event.
func StartReproductions(w http.ResponseWriter, r *http.Request) {
	tracerID, contextID, _, err := parsePathVariables(r)
	if err != nil {
		returnError(w, err)
		return
	}

	// Nothing here needs to wait for this to complete.
	go common.StartReproductions(tracerID, contextID)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte{})
}

// UpdateReproduction handles the HTTP API request for marking
// a reproduction test case as successful or not.
func UpdateReproduction(w http.ResponseWriter, r *http.Request) {
	var repro types.ReproductionTest
	if err := json.NewDecoder(r.Body).Decode(&repro); err != nil {
		returnError(w, err)
		return
	}

	tracerID, contextID, vars, err := parsePathVariables(r)
	if err != nil {
		returnError(w, err)
		return
	}

	reproIDs, ok := vars["reproID"]
	if !ok {
		returnError(w, fmt.Errorf("No reproID variable found in the path"))
		return
	}
	var reproID uint64
	reproID, err = strconv.ParseUint(reproIDs, 10, 32)
	if err != nil {
		returnError(w, fmt.Errorf("Not a valid uint for reproID"))
		return
	}

	if err = common.UpdateReproduction(tracerID, contextID, uint(reproID), repro); err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte{})
}

// parsePathVariables is a helper function used to parse the path
// variables for the repro API.
func parsePathVariables(r *http.Request) (uint, uint, map[string]string, error) {
	vars := mux.Vars(r)
	var (
		ok         bool
		tracerIDs  string
		contextIDs string
	)

	tracerIDs, ok = vars["tracerID"]
	if !ok {
		return 0, 0, nil, fmt.Errorf("No tracerID variable found in the path")
	}

	contextIDs, ok = vars["contextID"]
	if !ok {
		return 0, 0, nil, fmt.Errorf("No eventID variable found in the path")
	}

	var (
		tracerID  uint64
		contextID uint64
		err       error
	)
	tracerID, err = strconv.ParseUint(tracerIDs, 10, 32)
	if err != nil {
		return 0, 0, nil, fmt.Errorf("Not a valid uint for tracerID")
	}

	contextID, err = strconv.ParseUint(contextIDs, 10, 32)
	if err != nil {
		return 0, 0, nil, fmt.Errorf("Not a valid uint for contextID")
	}

	return uint(tracerID), uint(contextID), vars, nil
}
