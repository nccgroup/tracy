package rest

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/configure"
)

// Used to order request and their corresponding tests.
type RequestTestPair struct {
	Request *http.Request
	Test    func(*httptest.ResponseRecorder, *testing.T) error
}

// serverTestHelper takes a slice of RequestTestPairs. Each pair has a request and a
// test function. Each request is submitted and the corresponding test is run on the
// response. Tests are run sequence and each test is used to validate the response.
// This function can be used to chain request/response tests together, for example
// to test if a particular resource has been deleted or created. An error in the middle
// of a chain of requests will break since it is likely the following tests will also
// break. All tests in a set of RequestTestPairs will share the same test database.
func serverTestHelper(tests []RequestTestPair, i int, t *testing.T) {
	// Indicate that this is the prod database and not the test.
	dbDir := filepath.Join(os.TempDir(), "test")
	// Create the directory if it doesn't exist.
	if _, err := os.Stat(dbDir); os.IsNotExist(err) {
		os.Mkdir(dbDir, 0755)
	}
	db := filepath.Join(dbDir, fmt.Sprintf("tracer-test-db-%d.db", i))
	// Delete any existing database entries.
	configure.DeleteDatabase(db)
	// Open the database because the init method from main.go won't trigger.
	store.Open(db, false)

	for _, pair := range tests {
		// For each request/test combo:
		// 1.) send the request
		// 2.) collect the response
		// 3.) run the response on the test method
		// 4.) break on error
		rr := httptest.NewRecorder()
		RestRouter.ServeHTTP(rr, pair.Request)
		err := pair.Test(rr, t)
		if err != nil {
			t.Errorf("the following request did not pass it's test: %+v. Request body: %s", err, rr.Body.String())
			break
		}
	}
	store.DB.Close()
}

// serverTestHelperBulk executes a table of tests using serverTestHelper.
// Each row in the table gets its own database.
func serverTestHelperBulk(table [][]RequestTestPair, t *testing.T) {
	for i, row := range table {
		serverTestHelper(row, i, t)
	}
}
