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

/* Used to order request and their corresponding tests. */
type RequestTestPair struct {
	Request *http.Request
	Test 	func(*httptest.ResponseRecorder, *testing.T)error
}

/* Testing addTracer with httptest. POST /tracers */
func TestAddTracer(t *testing.T) {
	/* ADDING A TRACER */
	/////////////////////
	var (
		trcr_str= "blahblah"
		url 	= "http://example.com"
		method  = "GET"
	)
	json_str := fmt.Sprintf(`{"TracerString": "%s", "URL": "%s", "Method": "%s"}`,
		trcr_str, url, method)

	/* Make the POST request. */
	add_req, err := http.NewRequest("POST", "http://127.0.0.1:8081/tracers", bytes.NewBuffer([]byte(json_str)))
	if err != nil {
		t.Fatalf("Tried to build an HTTP request but got the following error: %+v\n", err)
	}
	t.Logf("Sending the following data: %s\n", json_str)
	/* ADDING A TRACER */
	/////////////////////

	/* GETING A TRACER */
	/////////////////////
	get_req, err := http.NewRequest("GET", "http://127.0.0.1:8081/tracers/1", nil)
	if err != nil {
		t.Fatalf("Tried to build an HTTP request but got the following error: %+v\n", err)
	}
	/* GETTING A TRACER */
	/////////////////////

	/* Create a mapping of the request/test and use the server helper to execute it. */
	tests := make([]RequestTestPair, 2)
	add_req_test := RequestTestPair{add_req, addTest}
	get_req_test := RequestTestPair{get_req, getTest}
	tests[0] = add_req_test
	tests[1] = get_req_test
	serverTestHelper(tests, t)
}

/* Testing deleteTracer. DELETE /tracers/<tracer_id> */
func TestDeleteTracer(t *testing.T) {
	/* ADDING A TRACER */
	/////////////////////
	var (
		trcr_str= "blahblah"
		url = "http://example.com"
		method  = "GET"
		del_url = "http://127.0.0.1:8081/tracers/1"
		add_url = "http://127.0.0.1:8081/tracers"
		json_str= fmt.Sprintf(`{"TracerString": "%s", "URL": "%s", "Method": "%s"}`,
			trcr_str, url, method)
	)

	t.Logf("Sending the following data: %s\n", json_str)
	add_req, err := http.NewRequest("POST", add_url, bytes.NewBuffer([]byte(json_str)))
	if err != nil {
		t.Fatalf("Tried to build an HTTP request but got the following error: %+v\n", err)
	}
	/* ADDING A TRACER */
	/////////////////////

	/* DELETING A TRACER */
	/////////////////////
	del_req, err := http.NewRequest("DELETE", del_url, nil)
	if err != nil {
		t.Fatalf("Tried to build an HTTP request but got the following error: %+v\n", err)
	}

	del_test := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		if status := rr.Code; status != http.StatusAccepted {
			return fmt.Errorf("DeleteTracer returned the wrong status code. Got %v, but wanted %v\n", status, http.StatusAccepted)
		} else {
			t.Logf("Status good. Got : %+v, Body: %s\n", status, rr.Body.String())
		}
		expected := `{"id": "1", "status": "deleted"}`
		if rr.Body.String() != expected {
			return fmt.Errorf("DeleteTracer returned the wrong body in the response. Got %s, but expected %s\n", rr.Body.String(), expected)
		}

		/* Return nil to indicate no problems. */
		return nil
	}
	/* DELETING A TRACER */
	/////////////////////

	
	/* GETTING A TRACER */
	/////////////////////
	get_req, err := http.NewRequest("GET", del_url, nil)
	if err != nil {
		t.Fatalf("Tried to build an HTTP request but got the following error: %+v\n", err)
	}

	get_not_test := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		if status := rr.Code; status != http.StatusNoContent {
			return fmt.Errorf("GetTracer returned the wrong status code. Got %v, but wanted %v\n", status, http.StatusNoContent)
		} else {
			t.Logf("Status good. Got : %+v, Body: %s\n", status, rr.Body.String())
		}

		/* Validate the server did not leak any data. */
		got := tracer.Tracer{}
		json.Unmarshal([]byte(rr.Body.String()), &got)
		if got.ID != 0 {
			return fmt.Errorf("GetTracer returned the wrong body in the response. Got %+v, but expected %+v\n", got, tracer.Tracer{})
		}

		/* Return nil to indicate no problems. */
		return nil
	}
	/* GETTING A TRACER */
	/////////////////////

	/* Create a slice of the RequestTestPairs and use the server helper to execute them. */
	tests := make([]RequestTestPair, 4)
	add_req_test := RequestTestPair{add_req, addTest}
	get_req_test := RequestTestPair{get_req, getTest}
	del_req_test := RequestTestPair{del_req, del_test}
	get_not_req_test := RequestTestPair{get_req, get_not_test}
	tests[0] = add_req_test
	tests[1] = get_req_test
	tests[2] = del_req_test
	tests[3] = get_not_req_test
	serverTestHelper(tests, t)
}

/* Testing editTracer. PUT /tracers/<tracer_id>/ */
func TestEditTracer(t *testing.T) {
	/* ADDING A TRACER */
	/////////////////////
	var (
		trcr_str= "blahblah"
		trcr_str_change = "zahzahzah"
		url = "http://example.com"
		url_change = "https://example.com"
		method  = "GET"
		method_change = "PUT"
		put_url = "http://127.0.0.1:8081/tracers/1"
		add_url = "http://127.0.0.1:8081/tracers"
		json_str= fmt.Sprintf(`{"TracerString": "%s", "URL": "%s", "Method": "%s"}`,
			trcr_str, url, method)
		put_str = fmt.Sprintf(`{"TracerString": "%s", "URL": "%s", "Method": "%s"}`,
			trcr_str_change, url_change, method_change)
	)

	t.Logf("Sending the following data: %s\n", json_str)
	add_req, err := http.NewRequest("POST", add_url, bytes.NewBuffer([]byte(json_str)))
	if err != nil {
		t.Fatalf("Tried to build an HTTP request, but got the following error: %+v\n", err)
	}
	/* ADDING A TRACER */
	/////////////////////

	/* PUTTING A TRACER */
	/////////////////////
	put_req, err := http.NewRequest("PUT", put_url, bytes.NewBuffer([]byte(put_str)))
	if err != nil {
		t.Fatalf("Tried to build an HTTP request, but got the following error: %+v\n", err)
	}

	put_test := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		if status := rr.Code; status != http.StatusCreated {
			return fmt.Errorf("EditTracer returned the wrong status code. Got %v, but wanted %v\n", status, http.StatusCreated)
		}

		/* Validate the server did not leak any data. */
		got := tracer.Tracer{}
		json.Unmarshal([]byte(rr.Body.String()), &got)
		if got.ID != 1 {
			return fmt.Errorf("EditTracer returned the wrong body ID. Got %+v, but expected %+v\n", got.ID, 1)
		}
		if got.URL.String != url_change {
			return fmt.Errorf("EditTracer returned the wrong body URL. Got %+v, but expected %+v\n", got.URL.String, put_url)
		}
		if got.Method.String != method_change {
			return fmt.Errorf("EditTracer returned the wrong body Method. Got %+v, but expected %+v\n", got.Method.String, method_change)
		}
		if got.TracerString != trcr_str_change {
			return fmt.Errorf("EditTracer returned the wrong body TracerString. Got %+v\n, but expected %+v\n", got.TracerString, trcr_str_change)
		}

		/* Return nil to indicate the test passed. */
		return nil
	}
	/* PUTTING A TRACER */
	/////////////////////	

	/* GETTING A TRACER */
	/////////////////////
	get_req, err := http.NewRequest("GET", put_url, bytes.NewBuffer([]byte(put_str)))
	if err != nil {
		t.Fatalf("Tried to build an HTTP request, but got the following error: %+v\n", err)
	}

	get_test := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		if status := rr.Code; status != http.StatusOK {
			return fmt.Errorf("GetTracer returned the wrong status code. Got %v, but wanted %v\n", status, http.StatusNoContent)
		} else {
			t.Logf("Status good. Got : %+v, Body: %s\n", status, rr.Body.String())
		}

		/* Validate the tracer was the first tracer inserted. */
		got := tracer.Tracer{}
		json.Unmarshal([]byte(rr.Body.String()), &got)

		if got.Method.String != method_change {
			return fmt.Errorf("EditTracer returned the wrong body Method. Got %+v, but expected %+v\n", got.Method.String, method_change)
		}
		if got.URL.String != url_change {
			return fmt.Errorf("EditTracer returned the wrong body URL. Got %+v, but expected %+v\n", got.URL.String, put_url)
		}
		if got.TracerString != trcr_str_change {
			return fmt.Errorf("EditTracer returned the wrong body TracerString. Got %+v\n, but expected %+v\n", got.TracerString, trcr_str_change)
		}

		/* Return nil to indicate the test passed. */
		return nil
	}
	/* GETTING A TRACER */
	/////////////////////

	tests := make([]RequestTestPair, 3)
	add_req_test := RequestTestPair{add_req, addTest}
	put_req_test := RequestTestPair{put_req, put_test}
	get_req_test := RequestTestPair{get_req, get_test}
	tests[0] = add_req_test
	tests[1] = put_req_test
	tests[2] = get_req_test
	serverTestHelper(tests, t)
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

/* A function that takes a map of requests to test functions. Each request is run in 
 * sequence and each test is used to validate the response. This function can be used to 
 * chain request/response tests together, for example to test if a particular resource
 * has been deleted or created. */
func serverTestHelper(tests []RequestTestPair, t *testing.T) {
	/* Delete any existing database entries */
	/* TODO: make a testing database. So that we don't delete a bunch of data when we run tests. */
	deleteDatabase(t)
	/* Open the database because the init method from main.go won't trigger. */
	openDatabase()
	/* Close the database handle. */
	defer TracerDB.Close()
	_, handler := configureServer()

	for _, pair := range tests {
		/* For each request/test combo:
		* 1.) send the request
		* 2.) collect the response
		* 3.) run the response on the test method
		* 4.) break on error */
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, pair.Request)
		err := pair.Test(rr, t)
		if err != nil {
			t.Errorf("The following request, %+v, did not pass it's test: %+v\n", pair.Request, err)
		}
	}
}

/* Commonly used GET request test. */
func getTest(rr *httptest.ResponseRecorder, t *testing.T) error {
	if status := rr.Code; status != http.StatusOK {
		return fmt.Errorf("GetTracer returned the wrong status code. Got %v, but wanted %v\n", status, http.StatusNoContent)
	} else {
		t.Logf("Status good. Got : %+v, Body: %s\n", status, rr.Body.String())
	}

	/* Validate the tracer was the first tracer inserted. */
	got := tracer.Tracer{}
	json.Unmarshal([]byte(rr.Body.String()), &got)
	if got.ID != 1 {
		return fmt.Errorf("GetTracer returned the wrong body in the response. Got ID of %+v, but expected %+v\n", got.ID, 1)
	}

	/* Return nil to indicate no problems. */
	return nil
}

/* Commonly used POST request test. */
func addTest(rr *httptest.ResponseRecorder, t *testing.T) error {
	/* Make sure the status code is 200. */
	if status := rr.Code; status != http.StatusOK {
		return fmt.Errorf("AddTracer returned the wrong status code: got %v, but wanted %v\n", status, http.StatusOK)
	} else {
		t.Logf("Status good. Got : %+v, Body: %s\n", status, rr.Body.String())
	}

	/* Make sure the body is a valid json object. */
	got := tracer.Tracer{}
	json.Unmarshal([]byte(rr.Body.String()), &got)
	t.Logf("Unmarshalled the data in the following way: %+v\n", got)
	if got.ID != 1 {
		return fmt.Errorf("The inserted tracer has the wrong ID. Expected 0, got: %d\n", got.ID)
	}
	if got.URL.String == "" {
		return fmt.Errorf("The inserted tracer has the wrong URL. Got: %s\n", got.URL.String)
	}
	if got.Method.String == "" {
		return fmt.Errorf("The inserted tracer has the wrong Method. Got: %s\n", got.Method.String)
	}

	/* Return nil to indicate nothing went wrong. */
	return nil
}