package rest

import (
	"fmt"
	"io"
	"net/http"
	"testing"

	"github.com/nccgroup/tracy/configure"
)

var (
	tracerString      = "blahblah"
	URL               = "http://example.com"
	addURL            = "http://127.0.0.1:7777/api/tracy/tracers"
	rawRequest        = "GET / HTTP/1.1\\nHost: gorm.io\\nUser-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:58.0) Gecko/20100101 Firefox/58.0\\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,;q=0.8\\nAccept-Language: en-US,en;q=0.5\\nAccept-Encoding: gzip, deflate\\nConnection: keep-alive\\nPragma: no-cacheCache-Control: no-cache"
	addTracerPayload  = fmt.Sprintf(`{"RawRequest": "%s", "RequestURL": "%s", "RequestMethod": "%s", "Tracers": [{"TracerPayload": "%s"}]}`, rawRequest, URL, http.MethodPost, tracerString)
	addTracerPayload2 = fmt.Sprintf(`{"RawRequest": "%s", "RequestURL": "%s", "RequestMethod": "%s", "Tracers": [{"TracerPayload": "%s2"}]}`, rawRequest, URL, http.MethodPost, tracerString)
	data              = "<a>blahblah</a>"
	location          = "dahlocation"
	eventType         = "dateventType"
	addEventURL       = "http://127.0.0.1:7777/api/tracy/tracers/1/events"
	eventString       = fmt.Sprintf(`{"RawEvent": {"Data": "%s"}, "EventURL": "%s", "EventType": "%s"}`, data, location, eventType)
)

func createAPIRequest(t *testing.T, method, url string, body io.Reader, auth string) *http.Request {
	req, err := http.NewRequest(method, url, body)
	if err != nil {
		t.Fatalf("tried to build an HTTP request, but got the following error: %+v", err)
	}
	if auth == "" {
		// The default user.
		req.Header.Add("Hoot", "d00164dd-f788-4e4a-9ca4-a9494d893b5b")
	} else {
		// For testing other users.
		req.Header.Add("Hoot", auth)
	}
	return req
}

// TestAllRest combines all the rest package tests into a table
// to avoid odd state things like database files.
func TestAllRest(t *testing.T) {
	configure.Setup()
	Configure()
	var table = [][]RequestTestPair{
		/*		testAddEvent(t),
				testDuplicateEvent(t),
				//		testGetAllConfig(t),
				testAddTracer(t),
				//		testSwitchProject(t),
				testUUIDGetTracers(t),
				testUUIDGetTracer(t),
				testUUIDEditTracers(t),
				testAddTracerBadAuth(t),
				testAddRequestByTracerPayload(t),*/
		testUUIDGetEvents(t),
	}

	serverTestHelperBulk(table, t)
}
