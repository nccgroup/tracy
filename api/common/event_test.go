package common

import (
	"encoding/json"
	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/configure"
	"os"
	"path/filepath"
	"testing"
)

func TestAddEventOneContext(t *testing.T) {
	tp := "lkasdmfasd"
	rd := `<b>` + tp + `</b>`
	testAddEventPayload(t, tp, rd, 1)
}

func TestAddEventSameLead(t *testing.T) {
	tp := "lkasdmfasd"
	rd := `<b>` + tp + ` ` + tp + `</b>`
	testAddEventPayload(t, tp, rd, 1)
}

func TestAddEventTwoContexts(t *testing.T) {
	tp := "lkasdmfasd"
	rd := `<b>` + tp + `</b>` + `<b>` + tp + `</b>`
	testAddEventPayload(t, tp, rd, 2)
}

func TestAddEventAttributeValue(t *testing.T) {
	tp := "lkasdmfasd"
	rd := `<b onload="` + tp + `">something</b>`
	testAddEventPayload(t, tp, rd, 1)
}

func TestAddEventNodeName(t *testing.T) {
	tp := "lkasdmfasd"
	rd := `<` + tp + `>something</b>`
	testAddEventPayload(t, tp, rd, 1)
}

func TestAddEventJSON(t *testing.T) {
	tp := "lkasdmfasd"
	rd := `{"a": "` + tp + `"}`
	testAddEventPayload(t, tp, rd, 0)
}

// Helper function to test specific data events and their expected output.
// As arguments, pass the testing pointer, the test payload, the raw data to test,
// and the expected number of DOM context events.
func testAddEventPayload(t *testing.T, tp, rd string, expected uint) {
	databaseInit()

	var (
		ts         = "zzPLAINzz"
		evts       = false
		loc   uint = types.Body
		sev   uint = 0
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

	re := AddEventData(rd)

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
	store.Open(db, true)
}

func validTracer(t *testing.T, e types.Tracer, ts, tp string, evts bool, loc, sev, i uint) {
	if e.TracerString != ts {
		t.Fatal("Got the wrong tracer string.")
	}
	if e.TracerPayload != tp {
		t.Fatal("Got the wrong tracer payload.")
	}
	if e.HasTracerEvents != evts {
		t.Fatal("Got the wrong events status.")
	}
	if e.TracerLocationType != types.Body {
		t.Fatal("Got the wrong location type.")
	}
	if e.TracerLocationIndex != i {
		t.Fatal("Got the wrong location index")
	}
}
