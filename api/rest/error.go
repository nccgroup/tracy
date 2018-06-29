package rest

import (
	"github.com/nccgroup/tracy/api/common"
	"github.com/nccgroup/tracy/log"
	"net/http"
)

func returnError(w http.ResponseWriter, err error) {
	log.Error.Print(err)
	w.WriteHeader(http.StatusInternalServerError)
	w.Write(common.ServerError(err))
}
