package rest

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/nccgroup/tracy/api/types"
)

// Testing adding a tracer event. POST /tracers/<tracer_id>/events
func testAddEvent(t *testing.T) []RequestTestPair {
	var (
		tracerString     = "blahblah"
		data             = "<a>blahblah</a>"
		URL              = "http://example.com"
		location         = "dahlocation"
		method           = "GET"
		eventType        = "dateventType"
		addEventURL      = "http://127.0.0.1:7777/tracers/1/events"
		addTracerURL     = "http://127.0.0.1:7777/tracers"
		rawRequest       = "GET / HTTP/1.1\\nHost: gorm.io\\nUser-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0\\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,;q=0.8\\nAccept-Language: en-US,en;q=0.5\\nAccept-Encoding: gzip, deflate\\nConnection: keep-alive\\nPragma: no-cacheCache-Control: no-cache"
		addTracerPayload = fmt.Sprintf(`{"RawRequest": "%s", "RequestURL": "%s", "RequestMethod": "%s", "Tracers": [{"TracerPayload": "%s"}]}`, rawRequest, URL, method, tracerString)
		eventString      = fmt.Sprintf(`{"RawEvent": {"Data": "%s"}, "EventURL": "%s", "EventType": "%s"}`, data, location, eventType)
	)

	addReq, err := http.NewRequest("POST", addTracerURL, bytes.NewBuffer([]byte(addTracerPayload)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	addReq.Header.Add("Hoot", "!")

	addEventReq, err := http.NewRequest("POST", addEventURL, bytes.NewBuffer([]byte(eventString)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	addEventReq.Header.Add("Hoot", "!")

	addEventTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		// Validate we got the status could that was expected.
		if status := rr.Code; status != http.StatusOK {
			return fmt.Errorf("addTracerEvent returned the wrong status code. Got %+v, but expected %+v", status, http.StatusOK)
		}
		// Validate the tracer was the first tracer inserted.
		got := types.TracerEvent{}
		json.Unmarshal([]byte(rr.Body.String()), &got)

		// Validate the response gave us back the event we added.
		if got.ID != 1 {
			return fmt.Errorf("addTracerEvent returned the wrong ID. Got %+v, but expected %+v", got.ID, 1)
		}
		if got.EventURL != location {
			return fmt.Errorf("addTracerEvent returned the wrong body location. Got %+v, but expected %+v", got.EventURL, location)
		}
		if got.EventType != eventType {
			return fmt.Errorf("addTracerEvent returned the wrong body event type. Got %+v, but expected %+v", got.EventType, eventType)
		}
		if len(got.DOMContexts) == 0 {
			return fmt.Errorf("addTracerEvent returned the wrong number of contexts. Got none, but expected one")
		}
		if got.DOMContexts[0].HTMLNodeType != "a" {
			return fmt.Errorf("addTracerEvent returned the wrong node name for the context. Got %s, but expected 'a'", got.DOMContexts[0].HTMLNodeType)
		}
		if got.DOMContexts[0].HTMLLocationType != 1 {
			return fmt.Errorf("addTracerEvent returned the wrong location type for the context. Got %d, but expected 1 (text)", got.DOMContexts[0].HTMLLocationType)
		}
		if strings.Trim(got.DOMContexts[0].EventContext, " ") != "blahblah" {
			return fmt.Errorf("addTracerEvent returned the wrong context data. Got '%s', but expected 'blahblah'", strings.Trim(got.DOMContexts[0].EventContext, " "))
		}
		if got.DOMContexts[0].ID != 1 {
			return fmt.Errorf("addTracerEvent returned the wrong ID. Got %d, but expected 1", got.DOMContexts[0].ID)
		}

		return nil
	}

	getEventReq, err := http.NewRequest("GET", fmt.Sprintf("%s", addEventURL), nil)
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	getEventReq.Header.Add("Hoot", "!")

	getEventTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		// Ensure we got the expected status code.
		if status := rr.Code; status != http.StatusOK {
			return fmt.Errorf("getTracerEvent returned the wrong status code. Got %+v, but expected %+v", status, http.StatusOK)
		}
		// Validate the first tracer even was inserted.
		got := []types.TracerEvent{}
		json.Unmarshal([]byte(rr.Body.String()), &got)

		if len(got) == 0 {
			return fmt.Errorf("addTracerEvent returned the wrong number of events. Got 0, but expected 1")
		}

		event := got[0]

		// Make sure the data we inserted was also the data we received back from the database.
		if event.ID != 1 {
			return fmt.Errorf("addTracerEvent returned the wrong ID. Got %+v, but expected %+v", event.ID, 1)
		}
		if event.EventURL != location {
			return fmt.Errorf("addTracerEvent returned the wrong body location. Got %+v, but expected %+v", event.EventURL, location)
		}
		if event.EventType != eventType {
			return fmt.Errorf("addTracerEvent returned the wrong body event type. Got %+v, but expected %+v", event.EventType, eventType)
		}

		if len(event.DOMContexts) != 1 {
			return fmt.Errorf("addTraceEvent returned the wrong number of DOM contexts. Got %d, but expected 1", len(event.DOMContexts))
		}

		context := event.DOMContexts[0]

		if context.TracerEventID != got[0].ID {
			return fmt.Errorf("addTraceEvent returned the wrong tracer event ID. Got %d, but expected %d", context.TracerEventID, got[0].ID)
		}
		if strings.TrimSpace(context.EventContext) != "blahblah" {
			return fmt.Errorf("addTraceEvent returned the wrong event context. Got '%s', but expected %s", strings.TrimSpace(context.EventContext), "blahblah")
		}
		if context.HTMLLocationType != 1 {
			return fmt.Errorf("addTraceEvent returned the wrong location type. Got %d, but expected 1", context.HTMLLocationType)
		}
		if context.HTMLNodeType != "a" {
			return fmt.Errorf("addTraceEvent returned the wrong node type. Got %s, but expected \"a\"", context.HTMLNodeType)

		}

		return nil
	}

	tests := make([]RequestTestPair, 3)
	addReqTest := RequestTestPair{addReq, addTest}
	addEventReqTest := RequestTestPair{addEventReq, addEventTest}
	getEventReqTest := RequestTestPair{getEventReq, getEventTest}
	tests[0] = addReqTest
	tests[1] = addEventReqTest
	tests[2] = getEventReqTest
	return tests
}

// Testing the database does not log duplicate events.
func testDuplicateEvent(t *testing.T) []RequestTestPair {
	var (
		tracerString     = "blahblah"
		data             = "dahdata<a>blahblah</a>"
		URL              = "http://example.com"
		location         = "dahlocation"
		method           = "GET"
		eventType        = "dateventType"
		addEventURL      = "http://127.0.0.1:7777/tracers/1/events"
		addTracerURL     = "http://127.0.0.1:7777/tracers"
		rawRequest       = "GET / HTTP/1.1\\nHost: gorm.io\\nUser-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0\\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,;q=0.8\\nAccept-Language: en-US,en;q=0.5\\nAccept-Encoding: gzip, deflate\\nConnection: keep-alive\\nPragma: no-cacheCache-Control: no-cache"
		addTracerPayload = fmt.Sprintf(`{"RawRequest": "%s", "RequestURL": "%s", "RequestMethod": "%s", "Tracers": [{"TracerPayload": "%s"}]}`, rawRequest, URL, method, tracerString)
		eventString      = fmt.Sprintf(`{"RawEvent": {"Data": "%s"}, "EventURL": "%s", "EventType": "%s"}`, data, location, eventType)
	)

	addReq, err := http.NewRequest("POST", addTracerURL, bytes.NewBuffer([]byte(addTracerPayload)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	addReq.Header.Add("Hoot", "!")
	addEventReq, err := http.NewRequest("POST", addEventURL, bytes.NewBuffer([]byte(eventString)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	addEventReq.Header.Add("Hoot", "!")

	addFirstEventTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		// Validate we got the status could that was expected.
		if status := rr.Code; status != http.StatusOK {
			return fmt.Errorf("addTracerEvent returned the wrong status code. Got %+v, but expected %+v", status, http.StatusOK)
		}
		// Validate the tracer was the first tracer inserted.
		got := types.TracerEvent{}
		json.Unmarshal([]byte(rr.Body.String()), &got)

		// Validate the response gave us back the event we added.
		if got.ID != 1 {
			return fmt.Errorf("addTracerEvent returned the wrong ID. Got %+v, but expected %+v", got.ID, 1)
		}
		if got.EventType != eventType {
			return fmt.Errorf("addTracerEvent returned the wrong body event type. Got %+v, but expected %+v", got.EventType, eventType)
		}
		if len(got.DOMContexts) == 0 {
			return fmt.Errorf("addTracerEvent returned the wrong number of contexts. Got none, but expected one")
		}
		if got.DOMContexts[0].HTMLNodeType != "a" {
			return fmt.Errorf("addTracerEvent returned the wrong node name for the context. Got %s, but expected 'a'", got.DOMContexts[0].HTMLNodeType)
		}
		if got.DOMContexts[0].HTMLLocationType != 1 {
			return fmt.Errorf("addTracerEvent returned the wrong location type for the context. Got %d, but expected 1 (text)", got.DOMContexts[0].HTMLLocationType)
		}
		if strings.TrimSpace(got.DOMContexts[0].EventContext) != "blahblah" {
			return fmt.Errorf("addTracerEvent returned the wrong context data. Got '%s', but expected 'blahblah'", strings.TrimSpace(got.DOMContexts[0].EventContext))
		}
		if got.DOMContexts[0].ID != 1 {
			return fmt.Errorf("addTracerEvent returned the wrong ID. Got %d, but expected 1", got.DOMContexts[0].ID)

		}

		return nil
	}

	addEventReqDup, err := http.NewRequest("POST", addEventURL, bytes.NewBuffer([]byte(eventString)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	addEventReqDup.Header.Add("Hoot", "!")

	addDupEventTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		var err error
		if status := rr.Code; status != http.StatusConflict {
			err = fmt.Errorf("adding a duplicate event should have returned an internal server error due to the unique constraint set by the database")
		}

		return err
	}

	tests := make([]RequestTestPair, 3)
	addReqTest := RequestTestPair{addReq, addTest}
	addEventReqTest := RequestTestPair{addEventReq, addFirstEventTest}
	addDupEvntReqTest := RequestTestPair{addEventReqDup, addDupEventTest}
	tests[0] = addReqTest
	tests[1] = addEventReqTest
	tests[2] = addDupEvntReqTest
	return tests
}
