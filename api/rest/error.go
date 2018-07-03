package rest

import (
	"net/http"

	"github.com/nccgroup/tracy/api/common"
	"github.com/nccgroup/tracy/log"
)

// returnError prints the error and writes it to the HTTP response.
func returnError(w http.ResponseWriter, err error) {
	log.Error.Print(err)
	w.WriteHeader(http.StatusInternalServerError)
	w.Write(common.ServerError(err))
}
