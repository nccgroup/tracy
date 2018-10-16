package common

import (
	"encoding/json"
	"io/ioutil"
	"path/filepath"
	"strings"

	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
)

// GetProjects queries the tracy path for all the
// available database files and returns the names of
// the files.
func GetProjects() ([]byte, error) {
	files, err := ioutil.ReadDir(configure.Current.TracyPath)
	if err != nil {
		return nil, err
	}

	var fns []string
	for _, f := range files {
		n := f.Name()
		ext := filepath.Ext(n)
		if ext == ".db" {
			fns = append(fns, strings.TrimSuffix(n, ext))
		}
	}

	r, err := json.Marshal(fns)
	if err != nil {
		return nil, err
	}

	return r, nil
}

// DeleteProject closes the currently opened database,
// and deletes the file associated with it.
func DeleteProject(p string) error {
	store.DB.Close()
	return configure.DeleteDatabase(filepath.Join(configure.Current.TracyPath, p+".db"))
}

// SwitchProject closes the currently opened database,
// sets the new database file and opens it.
func SwitchProject(p string) error {
	store.DB.Close()
	configure.Current.DatabasePath = filepath.Join(configure.Current.TracyPath, p+".db")
	return store.Open(configure.Current.DatabasePath, log.Verbose)
}
