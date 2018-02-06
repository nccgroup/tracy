package rest

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"tracy/api/types"
)

/* Testing addLabel with httptest. POST /labels */
func TestAddLabel(t *testing.T) {
	Configure()

	var (
		tracer    = "{{XSS2}}"
		tracer2   = "{{XSS3}}"
		payload   = "blahblahblah"
		labelURL  = "http://127.0.0.1:8081/labels"
		getURL    = "http://127.0.0.1:8081/labels/1"
		addLabel  = fmt.Sprintf(`{"tracer_string": "%s", "tracer_payload": "%s"}`, tracer, payload)
		addLabel2 = fmt.Sprintf(`{"tracer_string": "%s", "tracer_payload": "%s"}`, tracer2, payload)
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
		if got.ID != 1 {
			err = fmt.Errorf("addLabel returned the wrong ID. Got %d, but expected %d", got.ID, 1)
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
		if got.ID != 1 {
			err = fmt.Errorf("addLabel returned the wrong ID. Got %d, but expected %d", got.ID)
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
		if got.ID != 2 {
			err = fmt.Errorf("addLabel returned the wrong ID. Got %d, but expected %d", 2)
		} else if got.TracerString != tracer2 {
			err = fmt.Errorf("addLabel returned the wrong tracer. Got %s, but expected %s", got.TracerString, tracer2)
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
	ServerTestHelper(tests, t)
}
