package rest

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/nccgroup/tracy/api/types"
)

// testUUIDGetTracers tests that when getting all the tracers, the user
// requesting only gets the tracers that belong to them.
func testUUIDGetTracers(t *testing.T) []RequestTestPair {
	// Create a tracer as one user.
	addReq := createAPIRequest(t, http.MethodPost, addURL, bytes.NewBuffer([]byte(addTracerPayload)), "")
	// Create a tracer as a different user.
	addReq2 := createAPIRequest(t, http.MethodPost, addURL, bytes.NewBuffer([]byte(addTracerPayload2)), "f0699507-d88a-40cf-b965-b22320152396")
	// Make sure that user 1 only sees their tracers.
	getReq := createAPIRequest(t, http.MethodGet, addURL, nil, "")
	// Make sure that user 2 only sees their tracers.
	getReq2 := createAPIRequest(t, http.MethodGet, addURL, nil, "f0699507-d88a-40cf-b965-b22320152396")

	getUUIDTest := func(i uint) func(rr *httptest.ResponseRecorder, t *testing.T) error {
		return func(rr *httptest.ResponseRecorder, t *testing.T) error {
			// Make sure the status code is 200.
			if status := rr.Code; status != http.StatusOK {
				return fmt.Errorf("getUUIDTest returned the wrong status code: got %v, but wanted %v", status, http.StatusOK)
			}
			// Make sure the body is a valid JSON object.
			var got []types.Tracer
			json.Unmarshal([]byte(rr.Body.String()), &got)

			// Each user should only have one tracer.
			if len(got) != 1 {
				return fmt.Errorf("Unexpected number of tracers returned. Expected 1. Got %d", len(got))
			}

			// Make sure the tracer they got was only for their user.
			if got[0].ID != i {
				return fmt.Errorf("Unexpected data returned. Expected ID %d. Got ID %d", i, got[0].ID)
			}

			return nil
		}
	}

	return []RequestTestPair{
		RequestTestPair{addReq, addTest(1)},
		RequestTestPair{addReq2, addTest(2)},
		RequestTestPair{getReq, getUUIDTest(1)},
		RequestTestPair{getReq2, getUUIDTest(2)},
	}

}

// testUUIDGetTracer tests that when getting a specific tracer, the user
// requesting only gets the tracers that belong to them.
func testUUIDGetTracer(t *testing.T) []RequestTestPair {
	// Create a tracer as one user.
	addReq := createAPIRequest(t, http.MethodPost, addURL, bytes.NewBuffer([]byte(addTracerPayload)), "")
	// Create a tracer as a different user.
	addReq2 := createAPIRequest(t, http.MethodPost, addURL, bytes.NewBuffer([]byte(addTracerPayload2)), "f0699507-d88a-40cf-b965-b22320152396")
	// Make sure that user 1 can't see user 2's tracer.
	getReq := createAPIRequest(t, http.MethodGet, addURL+"/2", nil, "")
	// Make sure that user 2 can't see user 1's tracer.
	getReq2 := createAPIRequest(t, http.MethodGet, addURL+"/1", nil, "f0699507-d88a-40cf-b965-b22320152396")
	getReq3 := createAPIRequest(t, http.MethodGet, addURL, nil, "12399507-d88a-40cf-b965-b22320152396")

	getUUIDTest := func(i int) func(rr *httptest.ResponseRecorder, t *testing.T) error {
		return func(rr *httptest.ResponseRecorder, t *testing.T) error {
			// Make sure the status code is 200.
			if status := rr.Code; status != i {
				return fmt.Errorf("getUUIDTestTracer returned the wrong status code: got %d, but wanted %d", status, i)
			}

			return nil
		}
	}

	return []RequestTestPair{
		RequestTestPair{addReq, addTest(1)},
		RequestTestPair{addReq2, addTest(2)},
		RequestTestPair{getReq, getUUIDTest(http.StatusNotFound)},
		RequestTestPair{getReq2, getUUIDTest(http.StatusNotFound)},
		RequestTestPair{getReq3, getUUIDTest(http.StatusOK)},
	}

}

// testUUIDEditTracers tests that you can't modify another user's tracers.
func testUUIDEditTracers(t *testing.T) []RequestTestPair {
	// Create a tracer as a different user.
	addReq := createAPIRequest(t, http.MethodPost, addURL, bytes.NewBuffer([]byte(addTracerPayload)), "f0699507-d88a-40cf-b965-b22320152396")
	// Make sure that user 1 cannot modify the tracer of user 2.
	mod := "gotcha"
	upReq := createAPIRequest(t,
		http.MethodPut,
		addURL+"/1",
		bytes.NewBuffer([]byte(fmt.Sprintf("{\"TracerPayload\": \"%s\"}", mod))),
		"")
	// Verify the contents of user 2's tracer wasn't modified
	getReq := createAPIRequest(t, http.MethodGet, addURL, nil, "f0699507-d88a-40cf-b965-b22320152396")

	// Then, try to do a real update and make sure it goes through.
	upReq2 := createAPIRequest(t,
		http.MethodPut,
		addURL+"/1",
		bytes.NewBuffer([]byte(fmt.Sprintf("{\"TracerPayload\": \"%s\"}", mod))),
		"f0699507-d88a-40cf-b965-b22320152396")

	upTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		// Make sure the status code is 200.
		if status := rr.Code; status != http.StatusOK {
			return fmt.Errorf("upTest returned the wrong status code: got %v, but wanted %v", status, http.StatusOK)
		}
		return nil
	}

	getUpdateTest := func(str string) func(rr *httptest.ResponseRecorder, t *testing.T) error {
		return func(rr *httptest.ResponseRecorder, t *testing.T) error {
			// Make sure the status code is 200.
			if status := rr.Code; status != http.StatusOK {
				return fmt.Errorf("getUpdateTest returned the wrong status code: got %v, but wanted %v", status, http.StatusOK)
			}
			// Make sure the body is a valid JSON object.
			var got []types.Tracer
			json.Unmarshal([]byte(rr.Body.String()), &got)

			if len(got) != 1 {
				return fmt.Errorf("Unexpected number of tracers returned. Expected 1. Got %d", len(got))
			}

			// Make sure the tracer they got was only for their user.
			if got[0].TracerPayload != str {
				return fmt.Errorf("Unexpected data returned. The TracerPayload was expected to be %s. Got %s", mod, got[0].TracerPayload)
			}

			return nil
		}
	}

	return []RequestTestPair{
		RequestTestPair{addReq, addTest(1)},
		RequestTestPair{upReq, upTest},
		RequestTestPair{getReq, getUpdateTest(tracerString)},
		RequestTestPair{upReq2, upTest},
		RequestTestPair{getReq, getUpdateTest(mod)},
	}

}

func testAddRequestByTracerPayload(t *testing.T) []RequestTestPair {
	addReq := createAPIRequest(t, http.MethodPost, addURL, bytes.NewBuffer([]byte(addTracerPayload)), "")
	addReqByPayload := createAPIRequest(t,
		http.MethodPost,
		addURL+"/"+tracerString+"/request",
		bytes.NewBuffer([]byte(fmt.Sprintf(`{"RawRequest": "%s2", "RequestURL": "%s/2", "RequestMethod": "%s"}`, rawRequest, URL, http.MethodPost))),
		"")

	addReqByPayloadTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		// Make sure the status code is 200.
		if status := rr.Code; status != http.StatusOK {
			return fmt.Errorf("addReqByPayloadTest returned the wrong status code: got %d, but wanted %d", status, http.StatusOK)
		}

		return nil
	}

	getReqsTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		// Make sure the status code is 200.
		if status := rr.Code; status != http.StatusOK {
			return fmt.Errorf("getReqsTest returned the wrong status code: got %d, but wanted %d", status, http.StatusOK)
		}

		// Make sure the body is a valid JSON object.
		var got []types.Tracer
		json.Unmarshal([]byte(rr.Body.String()), &got)

		if len(got[0].Requests) != 2 {
			return fmt.Errorf("getReqsTest returned the wrong number of requests. Expected 2. Got %d", len(got[0].Requests))
		}

		if got[0].TracerPayload != tracerString {
			fmt.Errorf("getReqsTest returned the wrong data. Expected the tracer to be updated to have tracer payload %s", tracerString)
		}

		return nil
	}

	getReqs := createAPIRequest(t, http.MethodGet, addURL, nil, "")

	return []RequestTestPair{
		RequestTestPair{addReq, addTest(1)},
		RequestTestPair{addReqByPayload, addReqByPayloadTest},
		RequestTestPair{getReqs, getReqsTest},
	}
}

// testAddTracerBadAuth tests the UUID middleware is working properly.
func testAddTracerBadAuth(t *testing.T) []RequestTestPair {
	addReq := createAPIRequest(t, "POST", addURL, bytes.NewBuffer([]byte(addTracerPayload)), "blahblah")

	authTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		// Make sure the status code is 500 if a bad  UUID is sent.
		if status := rr.Code; status != http.StatusInternalServerError {
			return fmt.Errorf("authTest returned the wrong status code: got %d, but wanted %d", status, http.StatusInternalServerError)
		}
		return nil
	}

	return []RequestTestPair{
		RequestTestPair{addReq, authTest},
	}
}

// testAddTracer tests the add tracer functionality with httptest. POST /tracers
func testAddTracer(t *testing.T) []RequestTestPair {
	addReq := createAPIRequest(t, "POST", addURL, bytes.NewBuffer([]byte(addTracerPayload)), "")
	getReq := createAPIRequest(t, "GET", addURL+"/1", nil, "")

	return []RequestTestPair{
		RequestTestPair{addReq, addTest(1)},
		RequestTestPair{getReq, getTest},
	}
}

// getTest is the commonly used GET request test.
func getTest(rr *httptest.ResponseRecorder, t *testing.T) error {
	if status := rr.Code; status != http.StatusOK {
		return fmt.Errorf("GetTracer returned the wrong status code. Got %v, but wanted %v", status, http.StatusOK)
	}
	// Validate the tracer was the first tracer inserted.
	got := types.Tracer{}
	json.Unmarshal([]byte(rr.Body.String()), &got)

	// This test only looks for the tracer just added. The ID should be 1.
	if got.ID != 1 {
		return fmt.Errorf("getTracer returned the wrong body in the response. Got ID of %+v, but expected %+v", got.ID, 1)
	}

	return nil
}

// addTest is the commonly used POST request test.
func addTest(i uint) func(rr *httptest.ResponseRecorder, t *testing.T) error {
	return func(rr *httptest.ResponseRecorder, t *testing.T) error {
		// Make sure the status code is 200.
		if status := rr.Code; status != http.StatusOK {
			return fmt.Errorf("AddTracer returned the wrong status code: got %v, but wanted %v", status, http.StatusOK)
		}
		// Make sure the body is a valid JSON object.
		got := types.Tracer{}
		json.Unmarshal([]byte(rr.Body.String()), &got)

		// Sanity checks to make sure the added tracer wasn't empty.
		if got.ID != i {
			return fmt.Errorf("The inserted tracer has the wrong ID. Expected %d, got: %d", i, got.ID)
		}

		return nil
	}
}
