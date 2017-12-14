package rest

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"math/rand"
	"net/http"
	"strconv"
	"encoding/hex"
	"xxterminator-plugin/log"
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
		log.Error.Printf(err.Error())
	} else {
		/* Final success case. */
		status = http.StatusOK
		ret = trcrStr
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(status)
	w.Write(ret)
}

/*DeleteTracer decodes an HTTP request to delete an existing tracer using the ID in the URL. */
func DeleteTracer(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerID"]; ok {
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			ret = serverError(err)
			log.Error.Printf(err.Error())
		} else {
			trcrStatus, err := common.DeleteTracer(int(id))
			if err != nil {
				ret = serverError(err)
				log.Error.Printf(err.Error())
			} else {
				/* Final success case. */
				status = http.StatusAccepted
				ret = trcrStatus
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(status)
	w.Write(ret)
}

/*EditTracer decodes an HTTP request to alter an existing tracer using the ID in the URL. */
func EditTracer(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerID"]; ok {
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			ret = serverError(err)
			log.Error.Printf(err.Error())
		} else {
			trcr := types.Tracer{}
			json.NewDecoder(r.Body).Decode(&trcr)

			trcrStr, err := common.EditTracer(int(id), trcr)
			if err != nil {
				ret = serverError(err)
				log.Error.Printf(err.Error())
			} else {
				/* Final success case. */
				status = http.StatusCreated
				ret = trcrStr
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(status)
	w.Write(ret)
}

/*GetTracers Get all the tracer data structures. */
func GetTracers(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	trcrsStr, err := common.GetTracers()
	if err != nil {
		ret = serverError(err)
		log.Error.Printf(err.Error())
	} else {
		/* Final success case. */
		status = http.StatusOK
		ret = trcrsStr
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(status)
	w.Write(ret)
}

/*GetTracers Get all the tracer data structures. */
func GetTracersWithEvents(w http.ResponseWriter, r *http.Request) {
	ret := []byte("")
	status := http.StatusInternalServerError
	
	trcrsStr, err := common.GetTracersWithEvents()
	if err != nil {
		ret = serverError(err)
		log.Error.Printf(err.Error())
	} else {
		/* Final success case. */
		status = http.StatusOK
	}

	// Check if the request is cached
	eTagHash :=  hex.EncodeToString([]byte(strconv.Itoa(len(trcrsStr))))
	if eTagHash == r.Header.Get("If-None-Match") {
		status = http.StatusNotModified 
	} else {
		ret = trcrsStr
		w.Header().Set("Etag", eTagHash)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")
	}

	w.WriteHeader(status)
	w.Write(ret)
}

/*GetTracer Get the tracer data structure belonging to the ID in the URL. */
func GetTracer(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	vars := mux.Vars(r)
	if trcrID, ok := vars["tracerID"]; ok {
		id, err := strconv.ParseInt(trcrID, 10, 32)
		if err != nil {
			ret = serverError(err)
			log.Error.Printf(err.Error())
		} else {
			trcrStr, err := common.GetTracer(int(id))
			if err != nil {
				ret = serverError(err)
				log.Error.Printf(err.Error())
			} else {
				/* Final success case. */
				status = http.StatusOK
				ret = trcrStr
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(status)
	w.Write(ret)
}

/* Common function for logging an internal server error and serving back something generic. */
func serverError(err error) []byte {
	/* TODO: need to do something with this number. */
	ref := rand.Intn(10000000000000)
	return []byte(fmt.Sprintf(`{"Message":"Internal Server Error", "Reference":"%d"}`, ref))
}
