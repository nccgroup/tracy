package rest

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"net/http"
	"strconv"
	"tracy/log"
	"tracy/tracer/common"
	"tracy/tracer/types"
)

/*AddLabel decodes an HTTP request to add a new label to the database. */
func AddLabel(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError
	in := types.Label{}
	json.NewDecoder(r.Body).Decode(&in)

	labelStr, err := common.AddLabel(in)
	if err != nil {
		ret = ServerError(err)
		log.Error.Printf(err.Error())
	} else {
		/* Final success case. */
		status = http.StatusOK
		ret = labelStr
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(ret)
}

/*GetLabels gets all the label data structures. */
func GetLabels(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	labels, err := common.GetLabels()
	if err != nil {
		ret = ServerError(err)
		log.Error.Printf(err.Error())
	} else {
		/* Final success case. */
		status = http.StatusOK
		ret = labels
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(ret)
}

/*GetLabel gets the label data structure belonging to the ID in the URL. */
func GetLabel(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	vars := mux.Vars(r)
	if labelID, ok := vars["labelID"]; ok {
		id, err := strconv.ParseInt(labelID, 10, 32)
		if err != nil {
			ret = ServerError(err)
			log.Error.Printf(err.Error())
		} else {
			labels, err := common.GetLabel(int(id))
			if err != nil {
				ret = ServerError(err)
				log.Error.Printf(err.Error())
			} else {
				/* Final success case. */
				status = http.StatusOK
				ret = labels
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(ret)
}
