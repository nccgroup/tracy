package rest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

/* Testing readConfig. GET /config */
func TestGetAllConfig(t *testing.T) {
	Init()

	getReq, err := http.NewRequest("GET", "http://127.1.0.1:66666/config", nil)
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}

	getTest := func(rr *httptest.ResponseRecorder, t *testing.T) error {
		/* Return variable. */
		var err error

		/* Make sure we are getting the status we are expecting. */
		if status := rr.Code; status != http.StatusOK {
			err = fmt.Errorf("GetAllConfig returned the wrong status code. Got %v, but wanted %v", status, http.StatusOK)
		} else {
			/* Testing the contents here will be difficult based on how the configuration file is done in the home directory and if someone moved or altered it. */
			var got interface{}
			err = json.Unmarshal([]byte(rr.Body.String()), &got)
		}

		return err
	}

	tests := make([]RequestTestPair, 1)
	getReqTest := RequestTestPair{getReq, getTest}
	tests[0] = getReqTest
	ConfigTestHelper(tests, t)
}
