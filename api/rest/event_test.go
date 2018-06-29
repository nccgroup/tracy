package rest

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/nccgroup/tracy/api/types"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

/* Testing adding a tracer event. POST /tracers/<tracer_id>/events */
func TestAddEvent(t *testing.T) {
	Configure()

	var (
		tracerString     = "blahblah"
		data             = "<a>blahblah</a>"
		URL              = "http://example.com"
		location         = "dahlocation"
		method           = "GET"
		eventType        = "dateventType"
		addEventURL      = "http://127.0.0.1:8081/tracers/1/events"
		addTracerURL     = "http://127.0.0.1:8081/tracers"
		rawRequest       = "GET / HTTP/1.1\\nHost: gorm.io\\nUser-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0\\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,;q=0.8\\nAccept-Language: en-US,en;q=0.5\\nAccept-Encoding: gzip, deflate\\nConnection: keep-alive\\nPragma: no-cacheCache-Control: no-cache"
		addTracerPayload = fmt.Sprintf(`{"RawRequest": "%s", "RequestURL": "%s", "RequestMethod": "%s", "Tracers": [{"TracerPayload": "%s"}]}`, rawRequest, URL, method, tracerString)
		eventString      = fmt.Sprintf(`{"RawEvent": {"Data": "%s"}, "EventURL": "%s", "EventType": "%s"}`, data, location, eventType)
	)

	/* ADDING A TRACER */
	/////////////////////
	addReq, err := http.NewRequest("POST", addTracerURL, bytes.NewBuffer([]byte(addTracerPayload)))
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

	addEventTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
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
			if got.ID != 1 {
				err = fmt.Errorf("addTracerEvent returned the wrong ID. Got %+v, but expected %+v", got.ID, 1)
			} else if got.EventURL != location {
				err = fmt.Errorf("addTracerEvent returned the wrong body location. Got %+v, but expected %+v", got.EventURL, location)
			} else if got.EventType != eventType {
				err = fmt.Errorf("addTracerEvent returned the wrong body event type. Got %+v, but expected %+v", got.EventType, eventType)
			} else if len(got.DOMContexts) == 0 {
				err = fmt.Errorf("addTracerEvent returned the wrong number of contexts. Got none, but expected one")
			} else if got.DOMContexts[0].HTMLNodeType != "a" {
				err = fmt.Errorf("addTracerEvent returned the wrong node name for the context. Got %s, but expected 'a'", got.DOMContexts[0].HTMLNodeType)
			} else if got.DOMContexts[0].HTMLLocationType != 1 {
				err = fmt.Errorf("addTracerEvent returned the wrong location type for the context. Got %d, but expected 1 (text)", got.DOMContexts[0].HTMLLocationType)
			} else if strings.Trim(got.DOMContexts[0].EventContext, " ") != "blahblah" {
				err = fmt.Errorf("addTracerEvent returned the wrong context data. Got '%s', but expected 'blahblah'", strings.Trim(got.DOMContexts[0].EventContext, " "))
			} else if got.DOMContexts[0].ID != 1 {
				err = fmt.Errorf("addTracerEvent returned the wrong ID. Got %d, but expected 1", got.DOMContexts[0].ID)
			}
		}

		return err
	}
	/* ADDING AN EVENT */
	/////////////////////

	/* GETTING AN EVENT */
	/////////////////////
	getEventReq, err := http.NewRequest("GET", fmt.Sprintf("%s", addEventURL), nil)
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

			if len(got) == 0 {
				err = fmt.Errorf("addTracerEvent returned the wrong number of events. Got 0, but expected 1")
			} else {

				event := got[0]

				/* Make sure the data we inserted was also the data we received back from the database. */
				if event.ID != 1 {
					err = fmt.Errorf("addTracerEvent returned the wrong ID. Got %+v, but expected %+v", event.ID, 1)
				} else if event.EventURL != location {
					err = fmt.Errorf("addTracerEvent returned the wrong body location. Got %+v, but expected %+v", event.EventURL, location)
				} else if event.EventType != eventType {
					err = fmt.Errorf("addTracerEvent returned the wrong body event type. Got %+v, but expected %+v", event.EventType, eventType)
				}

				if len(event.DOMContexts) != 1 {
					err = fmt.Errorf("addTraceEvent returned the wrong number of DOM contexts. Got %d, but expected 1", len(event.DOMContexts))
				} else {

					context := event.DOMContexts[0]

					if context.TracerEventID != got[0].ID {
						err = fmt.Errorf("addTraceEvent returned the wrong tracer event ID. Got %d, but expected %d", context.TracerEventID, got[0].ID)
					} else if strings.TrimSpace(context.EventContext) != "blahblah" {
						err = fmt.Errorf("addTraceEvent returned the wrong event context. Got '%s', but expected %s", strings.TrimSpace(context.EventContext), "blahblah")
					} else if context.HTMLLocationType != 1 {
						err = fmt.Errorf("addTraceEvent returned the wrong location type. Got %d, but expected 1", context.HTMLLocationType)
					} else if context.HTMLNodeType != "a" {
						err = fmt.Errorf("addTraceEvent returned the wrong node type. Got %s, but expected \"a\"", context.HTMLNodeType)
					}
				}
			}
		}

		return err
	}
	/* GETTING AN EVENT */
	/////////////////////

	tests := make([]RequestTestPair, 3)
	addReqTest := RequestTestPair{addReq, addTest}
	addEventReqTest := RequestTestPair{addEventReq, addEventTest}
	getEventReqTest := RequestTestPair{getEventReq, getEventTest}
	tests[0] = addReqTest
	tests[1] = addEventReqTest
	tests[2] = getEventReqTest
	ServerTestHelper(tests, t)
}

/* Testing the database does not log duplicate events. */
func TestDuplicateEvent(t *testing.T) {
	Configure()

	var (
		tracerString     = "blahblah"
		data             = "dahdata<a>blahblah</a>"
		URL              = "http://example.com"
		location         = "dahlocation"
		method           = "GET"
		eventType        = "dateventType"
		addEventURL      = "http://127.0.0.1:8081/tracers/1/events"
		addTracerURL     = "http://127.0.0.1:8081/tracers"
		rawRequest       = "GET / HTTP/1.1\\nHost: gorm.io\\nUser-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0\\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,;q=0.8\\nAccept-Language: en-US,en;q=0.5\\nAccept-Encoding: gzip, deflate\\nConnection: keep-alive\\nPragma: no-cacheCache-Control: no-cache"
		addTracerPayload = fmt.Sprintf(`{"RawRequest": "%s", "RequestURL": "%s", "RequestMethod": "%s", "Tracers": [{"TracerPayload": "%s"}]}`, rawRequest, URL, method, tracerString)
		eventString      = fmt.Sprintf(`{"RawEvent": {"Data": "%s"}, "EventURL": "%s", "EventType": "%s"}`, data, location, eventType)
	)

	/* ADDING A TRACER */
	/////////////////////
	addReq, err := http.NewRequest("POST", addTracerURL, bytes.NewBuffer([]byte(addTracerPayload)))
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
			if got.ID != 1 {
				err = fmt.Errorf("addTracerEvent returned the wrong ID. Got %+v, but expected %+v", got.ID, 1)
			} else if got.EventType != eventType {
				err = fmt.Errorf("addTracerEvent returned the wrong body event type. Got %+v, but expected %+v", got.EventType, eventType)
			} else if len(got.DOMContexts) == 0 {
				err = fmt.Errorf("addTracerEvent returned the wrong number of contexts. Got none, but expected one")
			} else if got.DOMContexts[0].HTMLNodeType != "a" {
				err = fmt.Errorf("addTracerEvent returned the wrong node name for the context. Got %s, but expected 'a'", got.DOMContexts[0].HTMLNodeType)
			} else if got.DOMContexts[0].HTMLLocationType != 1 {
				err = fmt.Errorf("addTracerEvent returned the wrong location type for the context. Got %d, but expected 1 (text)", got.DOMContexts[0].HTMLLocationType)
			} else if strings.TrimSpace(got.DOMContexts[0].EventContext) != "blahblah" {
				err = fmt.Errorf("addTracerEvent returned the wrong context data. Got '%s', but expected 'blahblah'", strings.TrimSpace(got.DOMContexts[0].EventContext))
			} else if got.DOMContexts[0].ID != 1 {
				err = fmt.Errorf("addTracerEvent returned the wrong ID. Got %d, but expected 1", got.DOMContexts[0].ID)
			}
		}

		return err
	}

	addEventReqDup, err := http.NewRequest("POST", addEventURL, bytes.NewBuffer([]byte(eventString)))
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}

	addDupEventTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
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
	addDupEvntReqTest := RequestTestPair{addEventReqDup, addDupEventTest}
	tests[0] = addReqTest
	tests[1] = addEventReqTest
	tests[2] = addDupEvntReqTest
	ServerTestHelper(tests, t)
}
