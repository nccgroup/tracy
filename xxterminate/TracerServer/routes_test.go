package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"testing"
	"xxterminator-plugin/xxterminate/TracerServer/tracer"
	"net/http/httptest"
)

/* Testing addTracer with httptest. */
func TestAddTracer(t *testing.T) {
	var (
		trcr_str= "blahblah"
		url 	= "http://example.com"
		method  = "GET"
	)
	json_str := fmt.Sprintf(`{"TracerString": "%s", "URL": "%s", "Method": "%s"}`,
		trcr_str, url, method)
	t.Logf("Sending the following data: %s\n", json_str)

	req, err := http.NewRequest("POST", "http://127.0.0.1:8081/tracers", bytes.NewBuffer([]byte(json_str)))
	if err != nil {
		t.Fatalf("Tried to build an HTTP request but got the following error: %+v\n", err)
	}

	/* Handle all the server boiler plater and run our request on the router. */
	rr := serverHelper(req, t)

	/* Make sure the status code is 200. */
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("AddTracer returned the wrong status code: got %v, but wanted %v\n", status, http.StatusOK)
	} else {
		t.Logf("Status good. Got : %+v, Body: %s\n", status, rr.Body.String())
	}

	/* Make sure the body is a valid json object. */
	got := tracer.Tracer{}
	json.Unmarshal([]byte(rr.Body.String()), &got)
	t.Logf("Unmarshalled the data in the following way: %+v\n", got)
	if got.ID != 1 {
		t.Errorf("The inserted tracer has the wrong ID. Expected 0, got: %d\n", got.ID)
	}
	if got.URL.String != url {
		t.Errorf("The inserted tracer has the wrong URL. Expected: %s, got: %s\n", url, got.URL.String)
	}
	if got.Method.String != method {
		t.Errorf("The inserted tracer has the wrong Method. Expected %s, got: %s\n", method, got.Method.String)
	}
}

/* Helper function for starting the server and shutting it down. Pass it a function
 * and it will run it for you and throw the errors. */
func serverHelper(req *http.Request, t *testing.T) *httptest.ResponseRecorder {
	/* Delete any existing database entries */
	deleteDatabase(t)
	/* Open the database because the init method from main.go won't trigger. */
	openDatabase()

	/* Create a response recorder to capture the response from the route. */
	rr := httptest.NewRecorder()
	/* Configure the server. */
	_, handler := configureServer()

	/* Start it up (needs to be in a goroutine so we can stop it.) */
	handler.ServeHTTP(rr, req)

	/* Close the database handle. */
	TracerDB.Close()

	/* Return the response, so the caller can test the results. */
	return rr
}

/* Delete any existing database */
func deleteDatabase(t *testing.T) {
	/* Find the path of this package. */
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		t.Errorf("No caller information, therefore, can't find the database.")
	}
	/* Should be something like $GOPATH/src/xxterminator-plugin/xxtermiate/TracerServer/store/tracer-db.db */
	db_loc := path.Dir(filename) + string(filepath.Separator) + "store" + string(filepath.Separator) + "tracer-db.db"
	/* If the database exists, remove it. It will affect the test. */
	if _, err := os.Stat(db_loc); !os.IsNotExist(err) {
		err := os.Remove(db_loc)
		if err != nil {
			t.Errorf("Wasn't able to delete the database at: %s\n", db_loc)
		}
	}
}
