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

// testUUIDGetEvents tests that when getting all the events for a tracer, the user
// requesting only gets the events that belong to them.
func testUUIDGetEvents(t *testing.T) []RequestTestPair {
	// Create a tracer as one user.
	addReq := createAPIRequest(t, http.MethodPost, addURL, bytes.NewBuffer([]byte(addTracerPayload)), "")
	// Add an event to the tracer for user 1.
	addEventReq := createAPIRequest(t, http.MethodPost, addEventURL, bytes.NewBuffer([]byte(eventString)), "")
	// Make sure that user 1 can see their event.
	getReq := createAPIRequest(t, http.MethodGet, addEventURL, nil, "")
	// Make sure that user 2 can't see their event.
	getReq2 := createAPIRequest(t, http.MethodGet, addEventURL, nil, "f0699507-d88a-40cf-b965-b22320152396")

	getEventsUUIDTest := func(i, j int) func(rr *httptest.ResponseRecorder, t *testing.T) error {
		return func(rr *httptest.ResponseRecorder, t *testing.T) error {
			// Make sure the status code is 200.
			if status := rr.Code; status != j {
				return fmt.Errorf("getEventsUUIDTest returned the wrong status code: got %v, but wanted %v", status, http.StatusOK)
			}
			// Make sure the body is a valid JSON object.
			var got []types.TracerEvent
			json.Unmarshal([]byte(rr.Body.String()), &got)

			// Each user should only have one tracer.
			if len(got) != i {
				return fmt.Errorf("Unexpected number of tracers returned. Expected %d. Got %d", i, len(got))
			}
			return nil
		}
	}

	return []RequestTestPair{
		RequestTestPair{addReq, addTest(1)},
		RequestTestPair{addEventReq, addEventTest},
		RequestTestPair{getReq, getEventsUUIDTest(1, http.StatusOK)},
		RequestTestPair{getReq2, getEventsUUIDTest(0, http.StatusNotFound)},
	}

}

func addEventTest(rr *httptest.ResponseRecorder, t *testing.T) error {
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

// Testing adding a tracer event. POST /tracers/<tracer_id>/events
func testAddEvent(t *testing.T) []RequestTestPair {
	addReq := createAPIRequest(t, http.MethodPost, addURL, bytes.NewBuffer([]byte(addTracerPayload)), "")
	addEventReq := createAPIRequest(t, http.MethodPost, addEventURL, bytes.NewBuffer([]byte(eventString)), "")
	getEventReq := createAPIRequest(t, http.MethodGet, addEventURL, nil, "")

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

	return []RequestTestPair{
		RequestTestPair{addReq, addTest(1)},
		RequestTestPair{addEventReq, addEventTest},
		RequestTestPair{getEventReq, getEventTest},
	}

}

// Testing the database does not log duplicate events.
func testDuplicateEvent(t *testing.T) []RequestTestPair {
	addReq := createAPIRequest(t, http.MethodPost, addURL, bytes.NewBuffer([]byte(addTracerPayload)), "")
	addEventReq := createAPIRequest(t, http.MethodPost, addEventURL, bytes.NewBuffer([]byte(eventString)), "")

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

	addEventReqDup := createAPIRequest(t, http.MethodPost, addEventURL, bytes.NewBuffer([]byte(eventString)), "")

	addDupEventTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		var err error
		if status := rr.Code; status != http.StatusConflict {
			err = fmt.Errorf("adding a duplicate event should have returned an internal server error due to the unique constraint set by the database")
		}

		return err
	}

	return []RequestTestPair{
		RequestTestPair{addReq, addTest(1)},
		RequestTestPair{addEventReq, addFirstEventTest},
		RequestTestPair{addEventReqDup, addDupEventTest},
	}
}
