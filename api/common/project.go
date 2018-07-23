package common

import (
	"path/filepath"

	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
)

// DeleteProject closes the currently opened database,
// and deletes the file associated with it.
func DeleteProject(p string) error {
	store.DB.Close()
	return configure.DeleteDatabase(filepath.Join(configure.TracyPath, p))
}

// SwitchProject closes the currently opened database,
// sets the new database file and opens it.
func SwitchProject(p string) error {
	store.DB.Close()
	configure.DatabaseFile = filepath.Join(configure.TracyPath, p)

	if err := store.Open(configure.DatabaseFile, log.Verbose); err != nil {
		return err
	}

	return nil
}
