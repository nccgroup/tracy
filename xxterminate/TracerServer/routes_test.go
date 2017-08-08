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

/* Testing addTracer with httptest. POST /tracers */
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
	rr := oneRequestHelper(req, t)

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

/* Testing deleteTracer. DELETE /tracers/<tracer_id> */
func TestDeleteTracer(t *testing.T) {
	/* Delete any existing database entries */
	/* TODO: make a testing database. So that we don't delete a bunch of data when we run tests. */
	deleteDatabase(t)
	/* Open the database because the init method from main.go won't trigger. */
	openDatabase()
	/* Close the database handle. */
	defer TracerDB.Close()
		/* Configure the server. */
	_, handler := configureServer()

	var (
		trcr_str= "blahblah"
		add_url = "http://example.com"
		method  = "GET"
	)
	json_str := fmt.Sprintf(`{"TracerString": "%s", "URL": "%s", "Method": "%s"}`,
		trcr_str, add_url, method)
	t.Logf("Sending the following data: %s\n", json_str)

	/* First, add a tracer. */
	add_req, err := http.NewRequest("POST", "http://127.0.0.1:8081/tracers", bytes.NewBuffer([]byte(json_str)))
	if err != nil {
		t.Fatalf("Tried to build an HTTP request but got the following error: %+v\n", err)
	}

	/* Handle all the server boiler plater and run our request on the router. */
	/* Create a response recorder to capture the response from the route. */
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, add_req)

	/* Make sure the status code is 200. */
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("AddTracer returned the wrong status code: got %v, but wanted %v\n", status, http.StatusOK)
	}

	/* Make sure the body is a valid tracer object. */
	got := tracer.Tracer{}
	json.Unmarshal([]byte(rr.Body.String()), &got)
	t.Logf("Unmarshalled the data in the following way: %+v\n", got)
	if got.ID != 1 {
		t.Errorf("The inserted tracer has the wrong ID. Expected 0, got: %d\n", got.ID)
	}
	if got.URL.String != add_url {
		t.Errorf("The inserted tracer has the wrong URL. Expected: %s, got: %s\n", add_url, got.URL.String)
	}
	if got.Method.String != method {
		t.Errorf("The inserted tracer has the wrong Method. Expected %s, got: %s\n", method, got.Method.String)
	}

	/* Build the DELETE and GET request methods for testing. */
	del_url := fmt.Sprintf("http://127.0.0.1:8081/tracers/%d", got.ID)
	del_req, err := http.NewRequest("DELETE", del_url, nil)
	if err != nil {
		t.Fatalf("Tried to build an HTTP request but got the following error: %+v\n", err)
	}

	/* Last, double check by making a GET request for the element and verifying the server doesn't serve it again. */
	get_req, err := http.NewRequest("GET", del_url, nil)
	if err != nil {
		t.Fatalf("Tried to build an HTTP request but got the following error: %+v\n", err)
	}

	/* Reset the recorder. */
	rr = httptest.NewRecorder()

	/* Make the GET request to verify we added a new tracer. */
	handler.ServeHTTP(rr, get_req)

	/* Validate the server's response. */
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("GetTracer returned the wrong status code. Got %v, but wanted %v\n", status, http.StatusNoContent)
	} else {
		t.Logf("Status good. Got : %+v, Body: %s\n", status, rr.Body.String())
	}

	/* Validate the tracer was the first tracer inserted. */
	got = tracer.Tracer{}
	json.Unmarshal([]byte(rr.Body.String()), &got)
	if got.ID != 1 {
		t.Errorf("GetTracer returned the wrong body in the response. Got ID of %+v, but expected %+v\n", got.ID, 1)
	}

	/* Reset the recorder. */
	rr = httptest.NewRecorder()
	/* Server the DELETE request. */
	handler.ServeHTTP(rr, del_req)

	/* Validate the server response. */
	if status := rr.Code; status != http.StatusAccepted {
		t.Errorf("DeleteTracer returned the wrong status code. Got %v, but wanted %v\n", status, http.StatusAccepted)
	} else {
		t.Logf("Status good. Got : %+v, Body: %s\n", status, rr.Body.String())
	}
	expected := `{"id": "1", "status": "deleted"}`
	if rr.Body.String() != expected {
		t.Errorf("DeleteTracer returned the wrong body in the response. Got %s, but expected %s\n", rr.Body.String(), expected)
	}

	/* Reset the recorder. */
	rr = httptest.NewRecorder()
	/* Last, double check by making the same GET request from before and verifying
	 * the server doesn't serve the tracer again. */
	handler.ServeHTTP(rr, get_req)

	/* Validate the server response. */
	if status := rr.Code; status != http.StatusNoContent {
		t.Errorf("GetTracer returned the wrong status code. Got %v, but wanted %v\n", status, http.StatusNoContent)
	} else {
		t.Logf("Status good. Got : %+v, Body: %s\n", status, rr.Body.String())
	}

	/* Validate the server did not leak any data. */
	got = tracer.Tracer{}
	json.Unmarshal([]byte(rr.Body.String()), &got)
	if got.ID != 0 {
		t.Errorf("GetTracer returned the wrong body in the response. Got %+v, but expected %+v\n", got, tracer.Tracer{})
	}
}

/* Helper function for starting the server and shutting it down. Pass it a function
 * and it will run it for you and throw the errors. */
func oneRequestHelper(req *http.Request, t *testing.T) *httptest.ResponseRecorder {
	/* Delete any existing database entries */
	/* TODO: make a testing database. So that we don't delete a bunch of data when we run tests. */
	deleteDatabase(t)
	/* Open the database because the init method from main.go won't trigger. */
	openDatabase()
	/* Close the database handle. */
	defer TracerDB.Close()

	/* Create a response recorder to capture the response from the route. */
	rr := httptest.NewRecorder()
	/* Configure the server. */
	_, handler := configureServer()

	/* Call the request against the handler function. There is no need for a server. */
	handler.ServeHTTP(rr, req)


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
