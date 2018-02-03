package test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"tracy/configure"
	"tracy/log"
	"tracy/tracer/rest"
	"tracy/tracer/types"
)

/* Testing addTracer with httptest. POST /tracers */
func TestAddTracer(t *testing.T) {
	var (
		tracerString = "blahblah"
		URL          = "http://example.com"
		method       = "GET"
		addURL       = "http://127.0.0.1:8081/tracers"
		getURL       = "http://127.0.0.1:8081/tracers/1"
		rawRequest   = `GET / HTTP/1.1
Host: gorm.io
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Connection: keep-alive
Pragma: no-cache
Cache-Control: no-cache`
		addTracerString = fmt.Sprintf(`{"raw_request": "%s", "request_url": "%s", "request_method": "%s", tracers: [{"tracer_string": %s}]}`, rawRequest, URL, method, tracerString)
	)

	/* ADDING A TRACER */
	/////////////////////
	/* Make the POST request. */
	addReq, err := http.NewRequest("POST", addURL, bytes.NewBuffer([]byte(addTracerString)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	/* ADDING A TRACER */
	/////////////////////

	/* GETING A TRACER */
	/////////////////////
	getReq, err := http.NewRequest("GET", getURL, nil)
	if err != nil {
		t.Fatalf("tried to build an HTTP request but got the following error: %+v", err)
	}
	/* GETTING A TRACER */
	/////////////////////

	/* Create a mapping of the request/test and use the server helper to execute it. */
	tests := make([]RequestTestPair, 2)
	addReqTest := RequestTestPair{addReq, addTest}
	getReqTest := RequestTestPair{getReq, getTest}
	tests[0] = addReqTest
	tests[1] = getReqTest
	serverTestHelper(tests, t)
}

/* Testing adding a tracer event. POST /tracers/<tracer_id>/events */
func TestAddEvent(t *testing.T) {
	var (
		tracerString = "blahblah"
		data         = "dahdata<a>blahblah</a>"
		URL          = "http://example.com"
		location     = "dahlocation"
		method       = "GET"
		eventType    = "dateventType"
		addEventURL  = "http://127.0.0.1:8081/tracers/1/events"
		addTracerURL = "http://127.0.0.1:8081/tracers"
		rawRequest   = `GET / HTTP/1.1
Host: gorm.io
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Connection: keep-alive
Pragma: no-cache
Cache-Control: no-cache`
		addTracerString = fmt.Sprintf(`{"raw_request": "%s", "request_url": "%s", "request_method": "%s", tracers: [{"tracer_string": %s}]}`, rawRequest, URL, method, tracerString)
		eventString     = fmt.Sprintf(`{"raw_event": "%s", "event_url": "%s", "event_type": "%s"}`, data, location, eventType)
	)

	/* ADDING A TRACER */
	/////////////////////
	addReq, err := http.NewRequest("POST", addTracerURL, bytes.NewBuffer([]byte(addTracerString)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	/* ADDING A TRACER */
	/////////////////////

	/* ADDING AN EVENT */
	/////////////////////
	addEventReq, err := http.NewRequest("POST", addEventURL, bytes.NewBuffer([]byte(eventString)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}

	addEvntTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		/* Return variable. */
		var err error

		/* Validate we got the status could that was expected. */
		if status := rr.Code; status != http.StatusOK {
			err = fmt.Errorf("addTracerEvent returned the wrong status code. Got %+v, but expected %+v", status, http.StatusOK)
		} else {
			/* Validate the tracer was the first tracer inserted. */
			got := types.TracerEvent{}
			json.Unmarshal([]byte(rr.Body.String()), &got)

			/* Validate the response gave us back the event we added. */
			if got.Model.ID != 1 {
				err = fmt.Errorf("addTracerEvent returned the wrong ID. Got %+v, but expected %+v", got.Model.ID, 1)
			} else if got.RawEvent != data {
				err = fmt.Errorf("addTracerEvent returned the wrong body data. Got %+v, but expected %+v", got.RawEvent, data)
			} else if got.EventURL != location {
				err = fmt.Errorf("addTracerEvent returned the wrong body location. Got %+v, but expected %+v", got.EventURL, location)
			} else if got.EventType != eventType {
				err = fmt.Errorf("addTracerEvent returned the wrong body event type. Got %+v, but expected %+v", got.EventType, eventType)
			} else if len(got.DOMContexts) == 0 {
				err = fmt.Errorf("addTracerEvent returned the wrong number of contexts. Got none, but expected one")
			} else if got.Contexts[0].HTMLNodeType != "a" {
				err = fmt.Errorf("addTracerEvent returned the wrong node name for the context. Got %s, but expected 'a'", got.Contexts[0].HTMLNodeType)
			} else if got.Contexts[0].HTMLLocationType != 1 {
				err = fmt.Errorf("addTracerEvent returned the wrong location type for the context. Got %d, but expected 1 (text)", got.Contexts[0].HTMLLocationType)
			} else if got.Contexts[0].EventContext != "blahblah" {
				err = fmt.Errorf("addTracerEvent returned the wrong context data. Got %s, but expected 'blahblah'", got.Contexts[0].EventContext)
			} else if got.Contexts[0].Model.ID != 1 {
				err = fmt.Errorf("addTracerEvent returned the wrong ID. Got %d, but expected 1", got.Contexts[0].Model.ID)
			}
		}

		return err
	}
	/* ADDING AN EVENT */
	/////////////////////

	/* GETTING AN EVENT */
	/////////////////////
	getEventReq, err := http.NewRequest("GET", fmt.Sprintf("%s/1", addTracerURL), nil)
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}

	getEventTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		/* Return variable. */
		var err error

		/* Ensure we got the expected status code. */
		if status := rr.Code; status != http.StatusOK {
			err = fmt.Errorf("getTracerEvent returned the wrong status code. Got %+v, but expected %+v", status, http.StatusOK)
		} else {
			/* Validate the first tracer even was inserted. */
			got := []types.TracerEvent{}
			json.Unmarshal([]byte(rr.Body.String()), &got)

			/* Make sure we have enough events. */
			if len(got) == 0 {
				err = fmt.Errorf("addTracerEvent didn't have any events to use. Expected 1")
			} else {
				/* Otherwise, grab the event. */
				gotEvent := got[0]

				/* Make sure the data we inserted was also the data we received back from the database. */
				if gotEvent.Model.ID != 1 {
					err = fmt.Errorf("addTracerEvent returned the wrong ID. Got %+v, but expected %+v", gotEvent.Model.ID, 1)
				} else if gotEvent.RawEvent != data {
					err = fmt.Errorf("addTracerEvent returned the wrong body data. Got %+v, but expected %+v", gotEvent.RawEvent, data)
				} else if gotEvent.EventURL != location {
					err = fmt.Errorf("addTracerEvent returned the wrong body location. Got %+v, but expected %+v", gotEvent.EventURL, location)
				} else if gotEvent.EventType != eventType {
					err = fmt.Errorf("addTracerEvent returned the wrong body event type. Got %+v, but expected %+v", gotEvent.EventType, eventType)
				}
			}
		}

		return err
	}
	/* GETTING AN EVENT */
	/////////////////////

	tests := make([]RequestTestPair, 3)
	addReqTest := RequestTestPair{addReq, addTest}
	addEventReqTest := RequestTestPair{addEventReq, addEvntTest}
	getEventReqTest := RequestTestPair{getEventReq, getEventTest}
	tests[0] = addReqTest
	tests[1] = addEventReqTest
	tests[2] = getEventReqTest
	serverTestHelper(tests, t)
}

/* Testing the database does not log duplicate events. */
func TestDuplicateEvent(t *testing.T) {
	var (
		tracerString = "blahblah"
		data         = "dahdata<a>blahblah</a>"
		URL          = "http://example.com"
		location     = "dahlocation"
		method       = "GET"
		eventType    = "dateventType"
		addEventURL  = "http://127.0.0.1:8081/tracers/1/events"
		addTracerURL = "http://127.0.0.1:8081/tracers"
		rawRequest   = `GET / HTTP/1.1
Host: gorm.io
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Connection: keep-alive
Pragma: no-cache
Cache-Control: no-cache`
		addTracerString = fmt.Sprintf(`{"raw_request": "%s", "request_url": "%s", "request_method": "%s", tracers: [{"tracer_string": %s}]}`, rawRequest, URL, method, tracerString)
		eventString     = fmt.Sprintf(`{"raw_event": "%s", "event_url": "%s", "event_type": "%s"}`, data, location, eventType)
	)

	/* ADDING A TRACER */
	/////////////////////
	addReq, err := http.NewRequest("POST", addTracerURL, bytes.NewBuffer([]byte(addTracerString)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	/* ADDING A TRACER */
	/////////////////////

	/* ADDING AN EVENT */
	/////////////////////
	addEventReq, err := http.NewRequest("POST", addEventURL, bytes.NewBuffer([]byte(eventString)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}

	addFirstEventTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		/* Return variable. */
		var err error

		/* Validate we got the status could that was expected. */
		if status := rr.Code; status != http.StatusOK {
			err = fmt.Errorf("addTracerEvent returned the wrong status code. Got %+v, but expected %+v", status, http.StatusOK)
		} else {
			/* Validate the tracer was the first tracer inserted. */
			got := types.TracerEvent{}
			json.Unmarshal([]byte(rr.Body.String()), &got)

			/* Validate the response gave us back the event we added. */
			if got.Model.ID != 1 {
				err = fmt.Errorf("addTracerEvent returned the wrong ID. Got %+v, but expected %+v", got.Model.ID, 1)
			} else if got.RawEvent != data {
				err = fmt.Errorf("addTracerEvent returned the wrong body data. Got %+v, but expected %+v", got.RawEvent, data)
			} else if got.EventURL != location {
				err = fmt.Errorf("addTracerEvent returned the wrong body location. Got %+v, but expected %+v", got.EventURL, location)
			} else if got.EventType != eventType {
				err = fmt.Errorf("addTracerEvent returned the wrong body event type. Got %+v, but expected %+v", got.EventType, eventType)
			} else if len(got.DOMContexts) == 0 {
				err = fmt.Errorf("addTracerEvent returned the wrong number of contexts. Got none, but expected one")
			} else if got.Contexts[0].HTMLNodeType != "a" {
				err = fmt.Errorf("addTracerEvent returned the wrong node name for the context. Got %s, but expected 'a'", got.Contexts[0].HTMLNodeType)
			} else if got.Contexts[0].HTMLLocationType != 1 {
				err = fmt.Errorf("addTracerEvent returned the wrong location type for the context. Got %d, but expected 1 (text)", got.Contexts[0].HTMLLocationType)
			} else if got.Contexts[0].EventContext != "blahblah" {
				err = fmt.Errorf("addTracerEvent returned the wrong context data. Got %s, but expected 'blahblah'", got.Contexts[0].EventContext)
			} else if got.Contexts[0].Model.ID != 1 {
				err = fmt.Errorf("addTracerEvent returned the wrong ID. Got %d, but expected 1", got.Contexts[0].Model.ID)
			}
		}

		return err
	}

	addEventReqDup, err := http.NewRequest("POST", addEventURL, bytes.NewBuffer([]byte(eventString)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}

	addDupEvntTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		var err error
		if status := rr.Code; status != http.StatusConflict {
			err = fmt.Errorf("adding a duplicate event should have returned an internal server error due to the unique constraint set by the database")
		}

		return err
	}
	/* ADDING AN EVENT */
	/////////////////////

	tests := make([]RequestTestPair, 3)
	addReqTest := RequestTestPair{addReq, addTest}
	addEventReqTest := RequestTestPair{addEventReq, addFirstEventTest}
	addDupEvntReqTest := RequestTestPair{addEventReqDup, addDupEvntTest}
	tests[0] = addReqTest
	tests[1] = addEventReqTest
	tests[2] = addDupEvntReqTest
	serverTestHelper(tests, t)
}

/* Testing addLabel with httptest. POST /labels */
func TestAddLabel(t *testing.T) {
	var (
		tracer    = "{{XSS2}}"
		tracer2   = "{{XSS3}}"
		payload   = "blahblahblah"
		labelURL  = "http://127.0.0.1:8081/labels"
		getURL    = "http://127.0.0.1:8081/labels/1"
		addLabel  = fmt.Sprintf(`{"Tracer": "%s", "TracerPayload": "%s"}`, tracer, payload)
		addLabel2 = fmt.Sprintf(`{"Tracer": "%s", "TracerPayload": "%s"}`, tracer2, payload)
	)

	/* ADDING A LABEL */
	/////////////////////
	/* Make the POST request. */
	addFirstLabel, err := http.NewRequest("POST", labelURL, bytes.NewBuffer([]byte(addLabel)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}

	addFirstReqTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		var err error
		if status := rr.Code; status != http.StatusOK {
			err = fmt.Errorf("The server returned the wrong HTTP status. Expected http.StatusOK. Got %d", status)
		}

		/* Validate the tracer was the first tracer inserted. */
		got := types.Label{}
		json.Unmarshal([]byte(rr.Body.String()), &got)

		/* Validate the response gave us back the event we added. */
		if got.Model.ID != 1 {
			err = fmt.Errorf("addLabel returned the wrong ID. Got %d, but expected %d", got.Model.ID)
		} else if got.TracerString != tracer {
			err = fmt.Errorf("addLabel returned the wrong tracer. Got %s, but expected %s", got.TracerString, tracer)
		} else if got.TracerPayload != payload {
			err = fmt.Errorf("addLabel returned the wrong tracer payload. Got %s, but expected %s", got.TracerPayload, payload)
		}

		return err
	}
	/* ADDING A LABEL */
	/////////////////////

	/* GETING A LABEL */
	/////////////////////
	getReq, err := http.NewRequest("GET", getURL, nil)
	if err != nil {
		t.Fatalf("tried to build an HTTP request but got the following error: %+v", err)
	}

	getReqTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		var err error
		if status := rr.Code; status != http.StatusOK {
			err = fmt.Errorf("The server returned the wrong HTTP status. Expected http.StatusOK. Got %d", status)
		}

		/* Validate the tracer was the first tracer inserted. */
		got := types.Label{}
		json.Unmarshal([]byte(rr.Body.String()), &got)

		/* Validate the response gave us back the event we added. */
		if got.Model.ID != 1 {
			err = fmt.Errorf("addLabel returned the wrong ID. Got %d, but expected %d", got.Model.ID)
		} else if got.TracerString != tracer {
			err = fmt.Errorf("addLabel returned the wrong tracer. Got %s, but expected %s", got.TracerString, tracer)
		} else if got.TracerPayload != payload {
			err = fmt.Errorf("addLabel returned the wrong tracer payload. Got %s, but expected %s", got.TracerPayload, payload)
		}

		return err
	}
	/* GETTING A LABEL */
	/////////////////////

	/* ADDING A LABEL */
	/////////////////////
	addSecondReq, err := http.NewRequest("POST", labelURL, bytes.NewBuffer([]byte(addLabel2)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}

	addSecondReqTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		var err error
		if status := rr.Code; status != http.StatusOK {
			err = fmt.Errorf("The server returned the wrong HTTP status. Expected http.StatusOK. Got %d", status)
		}

		/* Validate the tracer was the first tracer inserted. */
		got := types.Label{}
		json.Unmarshal([]byte(rr.Body.String()), &got)

		/* Validate the response gave us back the event we added. */
		if got.Model.ID != 2 {
			err = fmt.Errorf("addLabel returned the wrong ID. Got %d, but expected %d", 2)
		} else if got.TracerString != tracer {
			err = fmt.Errorf("addLabel returned the wrong tracer. Got %s, but expected %s", got.TracerString, tracer)
		} else if got.TracerPayload != payload {
			err = fmt.Errorf("addLabel returned the wrong tracer payload. Got %s, but expected %s", got.TracerPayload, payload)
		}

		return err
	}
	/* ADDING A LABEL */
	/////////////////////

	/* GETING LABELS */
	/////////////////////
	getLabels, err := http.NewRequest("GET", labelURL, nil)
	if err != nil {
		t.Fatalf("tried to build an HTTP request but got the following error: %+v", err)
	}

	getLabelsTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		var err error
		if status := rr.Code; status != http.StatusOK {
			err = fmt.Errorf("The server returned the wrong HTTP status. Expected http.StatusOK. Got %d", status)
		}

		/* Validate the tracer was the first tracer inserted. */
		got := []types.Label{}
		json.Unmarshal([]byte(rr.Body.String()), &got)

		/* Validate the response gave us back the event we added. */
		if len(got) != 2 {
			err = fmt.Errorf("addLabel returned the number of labels. Got %d, but expected %d", len(got), 2)
		}

		return err
	}
	/* GETTING LABELS */
	/////////////////////

	/* Create a mapping of the request/test and use the server helper to execute it. */
	tests := make([]RequestTestPair, 4)
	tests[0] = RequestTestPair{addFirstLabel, addFirstReqTest}
	tests[1] = RequestTestPair{getReq, getReqTest}
	tests[2] = RequestTestPair{addSecondReq, addSecondReqTest}
	tests[3] = RequestTestPair{getLabels, getLabelsTest}
	serverTestHelper(tests, t)
}

/* A function that takes a slice of RequestTestPairs. Each pair has a request and a
 * test function. Each request is submitted and the corresponding test is run on the
 * response. Tests are run sequence and each test is used to validate the response.
 * This function can be used to chain request/response tests together, for example
 * to test if a particular resource has been deleted or created. An error in the middle
 * of a chain of requests will break since it is likely the following tests will also
 * break. */
func serverTestHelper(tests []RequestTestPair, t *testing.T) {
	/* Indicate that this is the prod database and not the test. */
	dbDir := filepath.Join(os.TempDir(), "test")
	/* Create the directory if it doesn't exist. */
	if _, err := os.Stat(dbDir); os.IsNotExist(err) {
		os.Mkdir(dbDir, 0755)
	}
	db := filepath.Join(dbDir, "tracer-db.db")
	/* Delete any existing database entries */
	configure.DeleteDatabase(db)
	/* Open the database because the init method from main.go won't trigger. */
	configure.Database(db)

	for _, pair := range tests {
		/* For each request/test combo:
		* 1.) send the request
		* 2.) collect the response
		* 3.) run the response on the test method
		* 4.) break on error */
		rr := httptest.NewRecorder()
		rest.RestRouter.ServeHTTP(rr, pair.Request)
		err := pair.Test(rr, t)
		if err != nil {
			t.Errorf("the following request, %+v, did not pass it's test: %+v. Request body: %s", pair.Request, err, rr.Body.String())
			break
		}
	}
}

/* Commonly used GET request test. */
func getTest(rr *httptest.ResponseRecorder, t *testing.T) error {
	/* Return variable. */
	var err error

	if status := rr.Code; status != http.StatusOK {
		err = fmt.Errorf("GetTracer returned the wrong status code. Got %v, but wanted %v", status, http.StatusOK)
	} else {
		/* Validate the tracer was the first tracer inserted. */
		got := types.Tracer{}
		json.Unmarshal([]byte(rr.Body.String()), &got)

		/* This test only looks for the tracer just added. The ID should be 1. */
		if got.ID != 1 {
			err = fmt.Errorf("getTracer returned the wrong body in the response. Got ID of %+v, but expected %+v", got.ID, 1)
		}
	}

	/* Return nil to indicate no problems. */
	return err
}

/* Commonly used POST request test. */
func addTest(rr *httptest.ResponseRecorder, t *testing.T) error {
	/* Return variable. */
	var err error

	/* Make sure the status code is 200. */
	if status := rr.Code; status != http.StatusOK {
		err = fmt.Errorf("AddTracer returned the wrong status code: got %v, but wanted %v", status, http.StatusOK)
	} else {
		/* Make sure the body is a valid JSON object. */
		got := types.Tracer{}
		json.Unmarshal([]byte(rr.Body.String()), &got)

		/* Sanity checks to make sure the added tracer wasn't empty. */
		if got.ID != 1 {
			err = fmt.Errorf("The inserted tracer has the wrong ID. Expected 1, got: %d", got.ID)
		} else if got.URL.String == "" {
			err = fmt.Errorf("The inserted tracer has the wrong URL. Got nothing, but expected: %s", got.URL.String)
		} else if got.Method.String == "" {
			err = fmt.Errorf("The inserted tracer has the wrong Method. Got: %s", got.Method.String)
		}
	}

	return err
}

func init() {
	log.Init()
	rest.Init()
}
