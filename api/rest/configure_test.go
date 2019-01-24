package rest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

// Testing readConfig. GET /config
func testGetAllConfig(t *testing.T) []RequestTestPair {
	getReq, err := http.NewRequest("GET", "http://127.0.0.1:7777/api/tracy/config", nil)
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	getReq.Header.Add("Hoot", "!")

	getTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		// Make sure we are getting the status we are expecting.
		if status := rr.Code; status != http.StatusOK {
			return fmt.Errorf("GetAllConfig returned the wrong status code. Got %v, but wanted %v", status, http.StatusOK)
		}

		// Testing the contents here will be difficult based on
		// how the configuration file is done in the home directory
		// and if someone moved or altered it.
		var got interface{}
		return json.Unmarshal([]byte(rr.Body.String()), &got)
	}

	tests := make([]RequestTestPair, 1)
	getReqTest := RequestTestPair{getReq, getTest}
	tests[0] = getReqTest
	return tests
}
