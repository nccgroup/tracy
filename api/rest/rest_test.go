package rest

import (
	"testing"

	"github.com/nccgroup/tracy/configure"
)

// TestAllRest combines all the rest package tests into a table
// to avoid odd state things like database files.
func TestAllRest(t *testing.T) {
	configure.Setup()
	Configure()
	var table = [][]RequestTestPair{
		testAddEvent(t),
		testDuplicateEvent(t),
		testGetAllConfig(t),
		testAddTracer(t),
		testSwitchProject(t),
		testDeleteProject(t),
	}

	serverTestHelperBulk(table, t)
}

/*TODO:not sure these really are accurate anymore. commenting them out until I
can figure out how to make them accurate
func BenchmarkFullProxyTLS(b *testing.B) {
	// Indicate that this is the prod database and not the test.
	dbDir := filepath.Join(os.TempDir(), "test")
	// Create the directory if it doesn't exist.
	if _, err := os.Stat(dbDir); os.IsNotExist(err) {
		os.Mkdir(dbDir, 0755)
	}
	db := filepath.Join(dbDir, fmt.Sprintf("tracer-test-db-%d.db", 3))
	// Delete any existing database entries.
	configure.DeleteDatabase(db)
	// Open the database because the init method from main.go won't trigger.
	store.Open(db, false)
	defer store.DB.Close()
	bs := "test1=zzXSSzz&test2=zzPLAINzz"
	// Given a url & a body, will make a post request to that
	// url through the proxy.
	request, err := http.NewRequest(http.MethodPost, "https://google.com",
		bufio.NewReader(strings.NewReader(bs)))
	if request != nil {
		defer request.Body.Close()
	}
	if err != nil {
		log.Error.Print(err)
		b.FailNow()
	}
	// Otherwise, we'll run out of file descriptors.
	request.Close = true
	// Otherwise, the message is sent as a chunked response, which we don't
	// support right now?
	request.ContentLength = int64(len(bs))

	rr := httptest.NewRecorder()
	// Benchmark proxying data with both types of trace strings
	for i := 0; i < b.N; i++ {
		Router.ServeHTTP(rr, request)
	}
}
*/
