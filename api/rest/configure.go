package rest

import (
	"net/http"

	"github.com/nccgroup/tracy/api/common"
)

// GetConfig gets the global configuration for the application.
func GetConfig(w http.ResponseWriter, r *http.Request) {
	config, err := common.GetConfig()
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(config)
}
