package common

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/configure"
)

func TestProjectsCommonAll(t *testing.T) {
	var table = []struct {
		test func()
	}{
		{test: testDeleteProject(t)},
		{test: testSwitchProject(t)},
	}
	for i, test := range table {
		if err := store.Open(setupDatabase(i), false); err != nil {
			t.Fatal(err)
		}
		test.test()
		store.DB.Close()
	}
}

// TestDeleteProject creates a project, deletes it, then
// verifies the database file was deleted.
func testDeleteProject(t *testing.T) func() {
	return func() {
		if err := SwitchProject("new-project"); err != nil {
			t.Fatal(err)
		}
		path := filepath.Join(configure.TracyPath, "new-project")

		if configure.DatabaseFile != path {
			t.Fatal("expected the database file to be named `new-project`")
		}

		if _, err := os.Stat(path); os.IsNotExist(err) {
			t.Fatal("no database found in the tracy path with name `new-project`")
		}

		if err := DeleteProject("new-project"); err != nil {
			t.Fatal(err)
		}

		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Fatal("a database was found in the tracy path with name `new-project` even after we deleted it")
		}
	}
}

// TestSwitchProject creates a project, switches to it,
// then verifies that a database file was created and the
// currently configured project is the newly created one.
func testSwitchProject(t *testing.T) func() {
	return func() {
		if err := SwitchProject("new-project"); err != nil {
			t.Fatal(err)
		}
		path := filepath.Join(configure.TracyPath, "new-project")

		if configure.DatabaseFile != path {
			t.Fatal("expected the database file to be named `new-project`")
		}

		if _, err := os.Stat(path); os.IsNotExist(err) {
			t.Fatal("no database found in the tracy path with name `new-project`")
		}
	}
}

// setupDatabase is a helper function that creates a database in a temporary directory.
func setupDatabase(i int) string {
	// Indicate that this is the prod database and not the test.
	dbDir := filepath.Join(os.TempDir(), "test")
	// Create the directory if it doesn't exist.
	if _, err := os.Stat(dbDir); os.IsNotExist(err) {
		os.Mkdir(dbDir, 0755)
	}

	db := filepath.Join(dbDir, fmt.Sprintf("tracer-test-db-%d.db", i))
	// Delete any existing database entries.
	configure.DeleteDatabase(db)

	return db
}
