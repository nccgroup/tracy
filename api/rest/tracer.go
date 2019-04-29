package rest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/nccgroup/tracy/api/common"
	"github.com/nccgroup/tracy/api/types"
)

// EditTracer handles the HTTP API request to edit a specific
// tracer specified by the URL ID.
func EditTracer(w http.ResponseWriter, r *http.Request) {
	var tracer types.Tracer
	if err := json.NewDecoder(r.Body).Decode(&tracer); err != nil {
		returnError(w, err)
		return
	}

	vars := mux.Vars(r)
	tracerIDs, ok := vars["tracerID"]
	if !ok {
		returnError(w, fmt.Errorf("No tracerID variable found in the path"))
		return
	}

	id, err := strconv.ParseUint(tracerIDs, 10, 32)
	if err != nil {
		returnError(w, err)
		return
	}

	u, ok := r.Context().Value(hh).(*uuid.UUID)
	if !ok {
		returnError(w, fmt.Errorf("Wrong value associated with the Hoot header"))
		return
	}
	us := u.String()
	tracer.UUID = us
	for i := range tracer.Requests {
		tracer.Requests[i].UUID = us
	}
	ret, err := common.EditTracer(tracer, uint(id))
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}

// AddRequests handles the HTTP API request to add a tracer
// with multiple requests to the database.
func AddRequests(w http.ResponseWriter, r *http.Request) {
	var in types.Tracer
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		returnError(w, err)
		return
	}

	u, ok := r.Context().Value(hh).(*uuid.UUID)
	if !ok {
		returnError(w, fmt.Errorf("Wrong value associated with the Hoot header"))
		return
	}
	us := u.String()
	in.UUID = us
	// Requests also need the UUID so that they can be updated separately.
	for i := range in.Requests {
		in.Requests[i].UUID = us
	}

	ret, err := common.AddRequests(in)
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}

// AddTracers handles the API request for adding a request with multiple
// tracers to the database.
func AddTracers(w http.ResponseWriter, r *http.Request) {
	var in types.Request
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		returnError(w, err)
		return
	}

	u, ok := r.Context().Value(hh).(*uuid.UUID)
	if !ok {
		returnError(w, fmt.Errorf("Wrong value associated with the Hoot header"))
		return
	}
	us := u.String()
	in.UUID = us
	for i := range in.Tracers {
		in.Tracers[i].UUID = us
	}
	ret, err := common.AddTracers(in)
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}

// UpdateRequest handles the HTTP API request to add a set of tracers from a Request
// to the database.
func UpdateRequest(w http.ResponseWriter, r *http.Request) {
	var in types.Request
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		returnError(w, err)
		return
	}

	u, ok := r.Context().Value(hh).(*uuid.UUID)
	if !ok {
		returnError(w, fmt.Errorf("Wrong value associated with the Hoot header"))
		return
	}
	us := u.String()
	for i := range in.Tracers {
		in.Tracers[i].UUID = us
	}
	ret, err := common.UpdateRequest(in)
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}

// AddRequestByID adds a request to the db based on the tracer ID.
func AddRequestByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tracerID, ok := vars["tracerID"]
	if !ok {
		returnError(w, fmt.Errorf("No tracerID variable found in the path"))
		return
	}

	var in types.Request
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		returnError(w, err)
		return
	}

	ID, err := strconv.ParseUint(tracerID, 10, 32)
	if err != nil {
		returnError(w, err)
		return
	}

	u, ok := r.Context().Value(hh).(*uuid.UUID)
	if !ok {
		returnError(w, fmt.Errorf("Wrong value associated with the Hoot header"))
		return
	}
	us := u.String()
	in.UUID = us
	for i := range in.Tracers {
		in.Tracers[i].UUID = us
	}

	ret, err := common.AddRequest(in, uint(ID))
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}

// AddRequestByTracerPayload adds a request to the DB based on the tracer payload.
func AddRequestByTracerPayload(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tracerPayload, ok := vars["tracerPayload"]
	if !ok {
		returnError(w, fmt.Errorf("No tracerPayload variable found in the path"))
		return
	}

	var in types.Request
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		returnError(w, err)
		return
	}

	u, ok := r.Context().Value(hh).(*uuid.UUID)
	if !ok {
		returnError(w, fmt.Errorf("Wrong value associated with the Hoot header"))
		return
	}
	us := u.String()
	in.UUID = us
	for i := range in.Tracers {
		in.Tracers[i].UUID = us
	}

	var tracers []types.Tracer
	tracersb, err := common.GetTracers(us)
	if err := json.Unmarshal(tracersb, &tracers); err != nil {
		returnError(w, err)
		return
	}
	var tracer *types.Tracer
	for _, v := range tracers {
		if v.TracerPayload == tracerPayload {
			tracer = &v
			break
		}
	}
	if tracer == nil {
		returnError(w, fmt.Errorf("Couldn't find a tracer with payload %s", tracerPayload))
		return
	}
	ret, err := common.AddRequest(in, tracer.ID)

	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}

// GetTracers handles the HTTP API request for getting all the tracers from the
// database.
func GetTracers(w http.ResponseWriter, r *http.Request) {
	u, ok := r.Context().Value(hh).(*uuid.UUID)
	if !ok {
		returnError(w, fmt.Errorf("Wrong value associated with the Hoot header"))
		return
	}

	ret, err := common.GetTracers(u.String())
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}

// GetTracer handles the HTTP API request to get the tracer specified by an ID.
func GetTracer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tracerID, ok := vars["tracerID"]
	if !ok {
		returnError(w, fmt.Errorf("No tracerID variable found in the path"))
		return
	}

	id, err := strconv.ParseUint(tracerID, 10, 32)
	if err != nil {
		returnError(w, err)
		return
	}
	u, ok := r.Context().Value(hh).(*uuid.UUID)
	if !ok {
		returnError(w, fmt.Errorf("Wrong value associated with the Hoot header"))
		return
	}

	ret, err := common.GetTracer(uint(id), u.String())
	if err != nil {
		if strings.Contains(err.Error(), "record not found") {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}
