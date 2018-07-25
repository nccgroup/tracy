package rest

import (
	"fmt"
	"net/http"

	"github.com/nccgroup/tracy/api/common"
)

// GetProjects handles the HTTP API request to get all the
// available projects.
func GetProjects(w http.ResponseWriter, r *http.Request) {
	projs, err := common.GetProjects()
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(projs)
}

// DeleteProject handles the HTTP API request to delete a
// project.
func DeleteProject(w http.ResponseWriter, r *http.Request) {
	proj := r.URL.Query().Get("proj")
	if proj == "" {
		returnError(w, fmt.Errorf("No project query parameter was found."))
		return
	}

	err := common.DeleteProject(proj)
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte{})
}

// SwitchProject handles the HTTP API request to switch between
// projects.
func SwitchProject(w http.ResponseWriter, r *http.Request) {
	proj := r.URL.Query().Get("proj")
	if proj == "" {
		returnError(w, fmt.Errorf("No project query parameter was found."))
		return
	}

	err := common.SwitchProject(proj)
	if err != nil {
		returnError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte{})
}
