package common

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/configure"
)

// Test cases for making sure the event severity is correct.
func TestAllSeverity(t *testing.T) {
	tp := "lkasdmfasd"
	var table = []struct {
		testPayload    string
		renderedOutput string
		expected       uint
	}{
		{tp, `<b>` + tp + `</b>`, 0},
		{tp, `<b onerror="` + tp + `">something</b>`, 2},
		{tp, `<b onclick="` + tp + `">something</b>`, 2},
		{tp, `<input value="` + tp + `">something</input>`, 1},
		{tp, `<a href="` + tp + `">something</a>`, 2},
		{tp, `<` + tp + `><a>something</a>`, 3},
		{tp, `<a ` + tp + `="blah">something</a>`, 3},
	}

	for _, row := range table {
		testSeverity(t, row.testPayload, row.renderedOutput, row.expected)
	}
}

// Test cases for making sure we are registering the correct number of DOM contexts
// from the given HTML data that might be returned by the plugin. When we encounter
// new edge cases that are not triggering a DOM context properly, add a new test
// to the top of this list.
func TestAllAddDOMEvents(t *testing.T) {
	tp := "lkasdmfasd"
	var table = []struct {
		testPayload    string
		renderedOutput string
		expected       uint
	}{
		{tp, `<b>` + tp + `</b>`, 1},
		{tp, `<b>` + tp + ` ` + tp + `</b>`, 1},
		{tp, `<b>` + tp + `</b>` + `<b>` + tp + `</b>`, 2},
		{tp, `<b onload="` + tp + `">something</b>`, 1},
		{tp, `<` + tp + `>something</b>`, 1},
		{tp, `{"a": "` + tp + `"}`, 0},
	}

	for _, row := range table {
		testAddEventPayload(t, row.testPayload, row.renderedOutput, row.expected)
	}
}

// TestAddEventDataJSON tests to make sure when we add a raw event to the database,
// it is properly tagged as JSON.
func TestAddEventDataJSON(t *testing.T) {
	tp := "lkasdmfasd"
	rd := `{"a": "` + tp + `"}`

	databaseInit()

	re, err := AddEventData(rd)
	if err != nil {
		t.Fatal(err)
	}

	if re.Format != types.JSON {
		t.Fatal("Should have tagged the data as JSON.")
	}
}

// TestAddEventDataHTML tests to make sure when we add a raw event to the database,
// it is properly tagged as HTML.
func TestAddEventDataHTML(t *testing.T) {
	tp := "lkasdmfasd"
	rd := `<` + tp + `>something</b>`

	re, err := AddEventData(rd)
	if err != nil {
		t.Fatal(err)
	}

	if re.Format != types.HTML {
		t.Fatal("Should have tagged the data as HTML.")
	}
}

// TestGetEvents tests that the events we inserted are returned properly.
func TestGetEvents(t *testing.T) {
	tp := "lkasdmfasd"
	rd := `<b>` + tp + `</b>` + `<b>` + tp + `</b>`
	testAddEventPayload(t, tp, rd, 2)
	var err error
	var tb []byte
	var tvs []types.TracerEvent

	if tb, err = GetEvents(0); err != nil {
		t.Fatal(err)
	}

	if err = json.Unmarshal(tb, &tvs); err != nil {
		t.Fatal("Failed to unmarshal the event we just added.")
	}

	if len(tvs) != 1 {
		t.Fatalf("Failed to get the correct number of tracers. Expected 1, got %d", len(tvs))
	}

	if len(tvs[0].DOMContexts) != 2 {
		t.Fatalf("Failed to get the correct number of DOM contexts. Expected 2, got %d", len(tvs[0].DOMContexts))
	}
}

// Helper function to test specific data events and their expected severity.
// As arguments, pass the testing pointer, the test payload, the raw data to test,
// and the expected severity.
func testSeverity(t *testing.T, tp, rd string, expected uint) {
	databaseInit()

	var (
		ts         = "zzPLAINzz"
		evts       = false
		loc   uint = types.Body
		sev   uint
		i     uint = 50
		meth       = "GET"
		url        = "normandy.cdn.mozilla.net"
		err   error
		b     []byte
		evntb []byte
		evnt  types.TracerEvent
		e     types.Tracer
		eurl  = "http://example.com"
		evtt  = "DOM"
	)
	rr := `GET /api/v1/action?q=` + ts + ` HTTP/1.1
Host: normandy.cdn.mozilla.net
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:55.0) Gecko/20100101 Firefox/55.0
Accept: application/json
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
origin: null
Connection: close

`
	r := types.Request{
		RawRequest:    rr,
		RequestMethod: meth,
		RequestURL:    url,
		Tracers: []types.Tracer{
			types.Tracer{
				TracerString:        ts,
				TracerPayload:       tp,
				HasTracerEvents:     evts,
				TracerLocationType:  loc,
				OverallSeverity:     sev,
				TracerLocationIndex: i,
			},
		},
	}

	AddTracer(r)

	if b, err = GetTracer(1); err != nil {
		t.Fatal("Got an error while getting tracer with ID 1s")
	}
	if err = json.Unmarshal(b, &e); err != nil {
		t.Fatal("Got an error unmarshalling the tracer we just inserted.")
	}
	validTracer(t, e, ts, tp, evts, loc, sev, i)

	re, err := AddEventData(rd)
	if err != nil {
		t.Fatal(err)
	}

	te := types.TracerEvent{
		EventURL:   eurl,
		EventType:  evtt,
		RawEventID: re.ID,
		RawEvent:   re,
	}

	if evntb, err = AddEvent(r.Tracers[0], te); err != nil {
		t.Fatal("Wasn't able to add an event.")
	}

	if err = json.Unmarshal(evntb, &evnt); err != nil {
		t.Fatal("Failed to unmarshal the event we just added.")
	}

	if len(evnt.DOMContexts) > 0 {
		if evnt.DOMContexts[0].Severity != expected {
			t.Fatalf("Failed to get the correct severity. Expected %d, got %d", expected, evnt.DOMContexts[0].Severity)
		}
	} else {
		t.Fatalf("Wrong number of DOM contexts were produced. Expected at least 1: %+v", evnt)
	}
}

// Helper function to test specific data events and their expected output.
// As arguments, pass the testing pointer, the test payload, the raw data to test,
// and the expected number of DOM context events.
func testAddEventPayload(t *testing.T, tp, rd string, expected uint) {
	databaseInit()

	var (
		tb    []byte
		tvs   []types.TracerEvent
		ts         = "zzPLAINzz"
		evts       = false
		loc   uint = types.Body
		sev   uint
		i     uint = 50
		meth       = "GET"
		url        = "normandy.cdn.mozilla.net"
		err   error
		b     []byte
		evntb []byte
		evnt  types.TracerEvent
		e     types.Tracer
		eurl  = "http://example.com"
		evtt  = "DOM"
	)
	rr := `GET /api/v1/action?q=` + ts + ` HTTP/1.1
Host: normandy.cdn.mozilla.net
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:55.0) Gecko/20100101 Firefox/55.0
Accept: application/json
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
origin: null
Connection: close

`
	r := types.Request{
		RawRequest:    rr,
		RequestMethod: meth,
		RequestURL:    url,
		Tracers: []types.Tracer{
			types.Tracer{
				TracerString:        ts,
				TracerPayload:       tp,
				HasTracerEvents:     evts,
				TracerLocationType:  loc,
				OverallSeverity:     sev,
				TracerLocationIndex: i,
			},
		},
	}

	AddTracer(r)

	if b, err = GetTracer(1); err != nil {
		t.Fatal("Got an error while getting tracer with ID 1s")
	}
	if err = json.Unmarshal(b, &e); err != nil {
		t.Fatal("Got an error unmarshalling the tracer we just inserted.")
	}
	validTracer(t, e, ts, tp, evts, loc, sev, i)

	re, err := AddEventData(rd)
	if err != nil {
		t.Fatal(err)
	}

	te := types.TracerEvent{
		EventURL:   eurl,
		EventType:  evtt,
		RawEventID: re.ID,
		RawEvent:   re,
	}

	if evntb, err = AddEvent(r.Tracers[0], te); err != nil {
		t.Fatal("Wasn't able to add an event.")
	}

	if err = json.Unmarshal(evntb, &evnt); err != nil {
		t.Fatal("Failed to unmarshal the event we just added.")
	}

	// We should only have one DOM context in this event.
	l := uint(len(evnt.DOMContexts))
	if l != expected {
		t.Fatalf("Was only expecting %d DOM context(s) from this event. Got %d instead.", expected, l)
	}

	// Also, check using the GetEvents API.
	if tb, err = GetEvents(0); err != nil {
		t.Fatal(err)
	}

	if err = json.Unmarshal(tb, &tvs); err != nil {
		t.Fatal("Failed to unmarshal the event we just added.")
	}

	if len(tvs) != 1 {
		t.Fatalf("Failed to get the correct number of tracers. Expected 1, got %d", len(tvs))
	}

	if uint(len(tvs[0].DOMContexts)) != expected {
		t.Fatalf("Failed to get the correct number of DOM contexts. Expected %d, got %d", expected, len(tvs[0].DOMContexts))
	}
}

// Helper function to configure a test database to write to for our tests.
func databaseInit() {
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
	store.Open(db, false)
}
