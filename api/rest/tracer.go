package rest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

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
	tracer.UUID = u.String()
	ret, err := common.EditTracer(tracer, uint(id))
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}

// AddTracers handles the HTTP API request to add a set of tracers from a Request
// to the database.
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
	for _, v := range in.Tracers {
		v.UUID = u.String()
	}

	ret, err := common.AddTracer(in)
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}

// AddTracers handles the HTTP API request to add a set of tracers from a Request
// to the database.
func updateRequest(w http.ResponseWriter, r *http.Request) {

	var in types.Request
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		returnError(w, err)
		return
	}

	ret, err := common.UpdateRequest(in)
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}

//AddRequest added a request to the db based on the ID
func AddRequest(w http.ResponseWriter, r *http.Request) {

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

	ret, err := common.AddRequest(in, uint(ID))
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
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
}

/* DEPRECATED
// GenerateTracer handles the HTTP API request for generating a new tracer and
// storing it in the database. Often used for frontend heavy applications that
// might start using the input right away before sending an HTTP request.
func GenerateTracer(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()

	tracerString := r.Form.Get("tracer_string")
	if len(tracerString) == 0 {
		returnError(w, fmt.Errorf("expected a tracer_string query parameter, but didn't find one"))
		return
	}

	requestURL := r.Form.Get("url")
	if len(requestURL) == 0 {
		returnError(w, fmt.Errorf("expected a url query parameter, but didn't find one"))
		return
	}

	// TODO: if we make this a hosted solution, this will have to be reworked
	// since the proxy code will be on the client and not on the server.
	id, payload, err := proxy.TransformTracerString([]byte(tracerString))
	if err != nil {
		returnError(w, err)
		return
	}

	genTracer := types.Request{
		RawRequest:    "GENERATED", // For generated tracers, there won't be a request
		RequestMethod: "GENERATED", // For generated tracers, there won't be a request method
		RequestURL:    requestURL,
		Tracers: []types.Tracer{
			types.Tracer{
				TracerPayload: id,
				TracerString:  tracerString,
			},
		},
	}

	if _, err = common.AddTracer(genTracer); err != nil {
		returnError(w, err)
		return
	}

	// AddTracer will only store the random ID and not any special characters that we
	// need to add to the text field. Therefore, we need to make a deep copy
	// of our generated tracer since it contains reference types that we need to
	// modify. If we don't deep copy before they are modified, we get a race condition.
	c := genTracer
	ct := genTracer.Tracers[0]
	c.Tracers = make([]types.Tracer, len(genTracer.Tracers))
	c.Tracers[0] = ct
	c.Tracers[0].TracerPayload = string(payload)

	ret, err := json.Marshal(c)
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(ret)
} */
