package rest

import (
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"tracy/api/store"
	"tracy/configure"
)

/* A function that takes a slice of RequestTestPairs. Each pair has a request and a
 * test function. Each request is submitted and the corresponding test is run on the
 * response. Tests are run sequence and each test is used to validate the response.
 * This function can be used to chain request/response tests together, for example
 * to test if a particular resource has been deleted or created. An error in the middle
 * of a chain of requests will break since it is likely the following tests will also
 * break. */
func ServerTestHelper(tests []RequestTestPair, t *testing.T) {
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
	store.Open(db, true)

	for _, pair := range tests {
		/* For each request/test combo:
		* 1.) send the request
		* 2.) collect the response
		* 3.) run the response on the test method
		* 4.) break on error */
		rr := httptest.NewRecorder()
		RestRouter.ServeHTTP(rr, pair.Request)
		err := pair.Test(rr, t)
		if err != nil {
			t.Errorf("the following request, %+v, did not pass it's test: %+v. Request body: %s", pair.Request, err, rr.Body.String())
			break
		}
	}
}
