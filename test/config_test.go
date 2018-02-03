package test

import (
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
	"tracy/tracer/store"
)

func init() {
	log.Init()
}

/* Testing readConfig. GET /config */
func TestGetAllConfig(t *testing.T) {
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
	configTestHelper(tests, t)
}

/* A function that takes a slice of RequestTestPairs. Each pair has a request and a
 * test function. Each request is submitted and the corresponding test is run on the
 * response. Tests are run sequence and each test is used to validate the response.
 * This function can be used to chain request/response tests together, for example
 * to test if a particular resource has been deleted or created. An error in the middle
 * of a chain of requests will break since it is likely the following tests will also
 * break. */
func configTestHelper(tests []RequestTestPair, t *testing.T) {
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
	store.Open(db)

	for _, pair := range tests {
		/* For each request/test combo:
		* 1.) send the request
		* 2.) collect the response
		* 3.) run the response on the test method
		* 4.) break on error */
		rr := httptest.NewRecorder()
		rest.ConfigRouter.ServeHTTP(rr, pair.Request)
		err := pair.Test(rr, t)
		if err != nil {
			t.Errorf("the following request, %+v, did not pass it's test: %+v. Request body: %s", pair.Request, err, rr.Body.String())
			break
		}
	}
}
