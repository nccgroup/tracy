package rest

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"xxterminator-plugin/log"
	"math/rand"
	"net/http"
	"strconv"
	"xxterminator-plugin/tracer/common"
	"xxterminator-plugin/tracer/types"
)

/*AddTracer decodes an HTTP request to add a new tracer to the database. */
func AddTracer(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError
	in := types.Tracer{}
	json.NewDecoder(r.Body).Decode(&in)

	trcrStr, err := common.AddTracer(in)
	if err != nil {
		ret = serverError(err)
	} else {
		/* Final success case. */
		status = http.StatusOK
		ret = trcrStr
	}

	w.WriteHeader(status)
	w.Header().Set("Content-Type", "application/json")
	w.Write(ret)
}

/*DeleteTracer decodes an HTTP request to delete an existing tracer using the ID in the URL. */
func DeleteTracer(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerId"]; ok {
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			ret = serverError(err)
		} else {
			trcrStatus, err := common.DeleteTracer(int(id))
			if err != nil {
				ret = serverError(err)
			} else {
				/* Final success case. */
				status = http.StatusAccepted
				ret = trcrStatus
			}
		}
	}

	w.WriteHeader(status)
	w.Header().Set("Content-Type", "application/json")
	w.Write(ret)
}

/*EditTracer decodes an HTTP request to alter an existing tracer using the ID in the URL. */
func EditTracer(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerId"]; ok {
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			ret = serverError(err)
		} else {
			trcr := types.Tracer{}
			json.NewDecoder(r.Body).Decode(&trcr)

			trcrStr, err := common.EditTracer(int(id), trcr)
			if err != nil {
				ret = serverError(err)
			} else {
				/* Final success case. */
				status = http.StatusCreated
				ret = trcrStr
			}
		}
	}

	w.WriteHeader(status)
	w.Header().Set("Content-Type", "application/json")
	w.Write(ret)
}

/*GetTracers Get all the tracer data structures. */
func GetTracers(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	trcrsStr, err := common.GetTracers()
	if err != nil {
		ret = serverError(err)
	} else {
		/* Final success case. */
		status = http.StatusOK
		ret = trcrsStr
	}

	w.WriteHeader(status)
	w.Header().Set("Content-Type", "application/json")
	w.Write(ret)
}

/*GetTracer Get the tracer data structure belonging to the ID in the URL. */
func GetTracer(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerId"]; ok {
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			ret = serverError(err)
		} else {
			trcrStr, err := common.GetTracer(int(id))
			if err != nil {
				ret = serverError(err)
			} else {
				/* Final success case. */
				status = http.StatusOK
				ret = trcrStr
			}
		}
	}

	w.WriteHeader(status)
	w.Header().Set("Content-Type", "application/json")
	w.Write(ret)
}

/* Common function for logging an internal server error and serving back something generic. */
func serverError(err error) []byte {
	ref := rand.Intn(10000000000000)
	log.Error.Printf("Reference %d: %s", ref, err.Error())

	return []byte(fmt.Sprintf(`{"Message":"Internal Server Error", "Reference":"%d"}`, ref))
}
