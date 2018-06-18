package rest

import (
	"encoding/json"

	"github.com/gorilla/mux"
	"github.com/nccgroup/tracy/api/common"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/log"
	"github.com/nccgroup/tracy/proxy"
	"net/http"
	"strconv"
)

/*AddTracers decodes an HTTP request to add a new tracer(s) to the database. */
func AddTracers(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError
	in := types.Request{}

	if err := json.NewDecoder(r.Body).Decode(&in); err == nil {
		if ret, err = common.AddTracer(in); err != nil {
			ret = ServerError(err)
			log.Error.Println(err)
		} else {
			status = http.StatusOK
		}
	}

	w.WriteHeader(status)
	w.Write(ret)
}

/*GetTracers gets all the tracers. */
func GetTracers(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError
	var err error

	filter := r.FormValue("filter")
	if filter == "TracerPayloads" {
		if ret, err = common.GetTracers(true); err == nil {
			status = http.StatusOK
		}
	} else if ret, err = common.GetTracers(false); err == nil {
		status = http.StatusOK
	}

	if err != nil {
		ret = ServerError(err)
		log.Error.Println(err)
	}

	w.WriteHeader(status)
	w.Write(ret)
}

/*GetTracer gets the tracer data structure belonging to the ID in the URL. */
func GetTracer(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	vars := mux.Vars(r)
	if tracerID, ok := vars["tracerID"]; ok {
		if id, err := strconv.ParseUint(tracerID, 10, 32); err != nil {
			ret = ServerError(err)
			log.Error.Println(err)
		} else {
			if ret, err = common.GetTracer(uint(id)); err != nil {
				ret = ServerError(err)
				log.Error.Println(err)
			} else {
				status = http.StatusOK
			}
		}
	}

	w.WriteHeader(status)
	w.Write(ret)
}

/*GenerateTracer generates a new tracer and stored it in the database. Often used for
 * frontend heavy applications that might start using the input right away before
 * sending a request to the Tracy proxy. */
func GenerateTracer(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	r.ParseForm()
	tracerString := r.Form.Get("tracer_string")
	if len(tracerString) != 0 {
		requestURL := r.Form.Get("url")
		if len(requestURL) != 0 {
			id, payload, err := proxy.TransformTracerString([]byte(tracerString))
			if err == nil {
				//TODO: should collect more information about the location of where
				// it was generated. generating a tracer like this loses information
				// about inputs without being obvious about it. if we wanted to do
				// reproduction steps, how would we do that here?
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
					ret = ServerError(err)
				} else {
					status = http.StatusOK
					// AddTracer will only store the random ID and not any special characters that we
					// need to add to the text field. Therefore, we need to make a deep copy
					// of our generated tracer since it contains reference types that we need to
					// modify. If we don't deep copy before they are modified, we get a race condition.
					c := genTracer
					ct := genTracer.Tracers[0]
					c.Tracers = make([]types.Tracer, len(genTracer.Tracers))
					c.Tracers[0] = ct
					c.Tracers[0].TracerPayload = string(payload)
					ret, err = json.Marshal(c)
				}
			}

			if err != nil {
				log.Error.Println(err)
			}
		}
	}

	w.WriteHeader(status)
	w.Write(ret)
}

/*GetRequest gets the tracer raw request string belonging to the tracer ID in the URL. */
func GetRequest(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	vars := mux.Vars(r)
	if tracerID, ok := vars["tracerID"]; ok {
		if id, err := strconv.ParseUint(tracerID, 10, 32); err != nil {
			ret = ServerError(err)
			log.Error.Printf(err.Error())
		} else {
			if ret, err = common.GetTracerRequest(uint(id)); err != nil {
				ret = ServerError(err)
				log.Error.Println(err)
			} else {
				status = http.StatusOK
			}
		}
	}

	w.WriteHeader(status)
	w.Write(ret)
}
