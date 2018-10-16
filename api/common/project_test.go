package common

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
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
		{test: testGetProjects(t)},
	}
	for i, test := range table {
		if err := store.Open(setupDatabase(i), false); err != nil {
			t.Fatal(err)
		}
		test.test()
		store.DB.Close()
	}
	files, err := ioutil.ReadDir(configure.Current.TracyPath)
	if err != nil {
		t.Fatal(err)
	}
	for _, f := range files {
		n := f.Name()
		if strings.HasPrefix(n, "new") {
			if err := os.Remove(filepath.Join(configure.Current.TracyPath, n)); err != nil {
				t.Fatal(err)
			}

		}
	}
}

// testDeleteProject creates a project, deletes it, then
// verifies the database file was deleted.
func testDeleteProject(t *testing.T) func() {
	return func() {
		if err := SwitchProject("new-project"); err != nil {
			t.Fatal(err)
		}
		path := filepath.Join(configure.Current.TracyPath, "new-project")

		if configure.Current.DatabasePath != path+".db" {
			t.Fatal("expected the database file to be named `new-project.db`")
		}

		if _, err := os.Stat(path + ".db"); os.IsNotExist(err) {
			t.Fatal("no database found in the tracy path with name `new-project.db`")
		}

		if err := DeleteProject("new-project"); err != nil {
			t.Fatal(err)
		}

		if _, err := os.Stat(path + ".db"); !os.IsNotExist(err) {
			t.Fatal("a database was found in the tracy path with name `new-project.db` even after we deleted it")
		}
	}
}

// testGetProjects adds a bunch of projects and tries to
// retrieve them to make sure they were created correctly.
func testGetProjects(t *testing.T) func() {
	return func() {
		if err := SwitchProject("new-project1"); err != nil {
			t.Fatal(err)
		}
		if err := SwitchProject("new-project2"); err != nil {
			t.Fatal(err)
		}
		if err := SwitchProject("new-project3"); err != nil {
			t.Fatal(err)
		}

		projs, err := GetProjects()
		if err != nil {
			t.Fatal(err)
		}

		var m []string
		err = json.Unmarshal(projs, &m)
		if err != nil {
			t.Fatal(err)
		}

		if len(m) != 4 {
			t.Fatalf("Expected 4 database files, but got %d", len(m))
		}

		if err := DeleteProject("new-project1"); err != nil {
			t.Fatal(err)
		}
		if err := DeleteProject("new-project2"); err != nil {
			t.Fatal(err)
		}

		projs2, err := GetProjects()
		if err != nil {
			t.Fatal(err)
		}

		var m2 []string
		err = json.Unmarshal(projs2, &m2)
		if err != nil {
			t.Fatal(err)
		}

		if len(m2) != 2 {
			t.Fatalf("Expected 2 database files, but got %d", len(m2))
		}

		if err := DeleteProject("new-project3"); err != nil {
			t.Fatal(err)
		}

	}
}

// testSwitchProject creates a project, switches to it,
// then verifies that a database file was created and the
// currently configured project is the newly created one.
func testSwitchProject(t *testing.T) func() {
	return func() {
		if err := SwitchProject("new-project"); err != nil {
			t.Fatal(err)
		}
		path := filepath.Join(configure.Current.TracyPath, "new-project")

		if configure.Current.DatabasePath != path+".db" {
			t.Fatal("expected the database file to be named `new-project.db`")
		}

		if _, err := os.Stat(path + ".db"); os.IsNotExist(err) {
			t.Fatal("no database found in the tracy path with name `new-project.db`")
		}

		if err := DeleteProject("new-project"); err != nil {
			t.Fatal(err)
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
