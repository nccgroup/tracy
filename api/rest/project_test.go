package rest

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func testSwitchProject(t *testing.T) []RequestTestPair {
	req, err := http.NewRequest("PUT", "http://127.0.0.1:7777/api/tracy/projects", nil)
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	req.Header.Add("Hoot", "!")
	q := req.URL.Query()
	q.Add("proj", "test-proj")
	req.URL.RawQuery = q.Encode()

	tst := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		// Validate we got the status could that was expected.
		if status := rr.Code; status != http.StatusOK {
			return fmt.Errorf("testSwitchProject returned the wrong status code. Got %+v, but expected %+v", status, http.StatusOK)
		}

		return nil
	}
	tests := []RequestTestPair{
		RequestTestPair{req, tst},
	}

	return tests
}

func testDeleteProject(t *testing.T) []RequestTestPair {
	req, err := http.NewRequest("DELETE", "http://127.0.0.1:7777/api/tracy/projects", nil)
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	req.Header.Add("Hoot", "!")
	q := req.URL.Query()
	q.Add("proj", "test-proj")
	req.URL.RawQuery = q.Encode()

	tst := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		// Validate we got the status could that was expected.
		if status := rr.Code; status != http.StatusOK {
			return fmt.Errorf("testSwitchProject returned the wrong status code. Got %+v, but expected %+v", status, http.StatusOK)
		}

		return nil
	}
	tests := []RequestTestPair{
		RequestTestPair{req, tst},
	}

	return tests
}
