package rest

import (
	"net/http"
	"tracy/tracer/common"
)

/*GetConfig gets the global configuration for the application. */
func GetConfig(w http.ResponseWriter, r *http.Request) {
	ret := []byte("{}")
	status := http.StatusInternalServerError

	config, err := common.GetConfig()
	if err == nil {
		status = http.StatusOK
		ret = config
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(ret)
}
