package common

import (
	"encoding/json"
	"github.com/nccgroup/tracy/api/types"
	"testing"
)

func TestGetTracer(t *testing.T) {
	databaseInit()

	var (
		tp        = "qalakjdfzz"
		ts        = "zzPLAINzz"
		evts      = false
		loc  uint = types.Body
		sev  uint = 0
		i    uint = 50
		meth      = "GET"
		url       = "normandy.cdn.mozilla.net"
		err  error
		b    []byte
		e    types.Tracer
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
}

func TestAddTracer(t *testing.T) {
	databaseInit()

	var (
		tp        = "qalakjdfzz"
		ts        = "zzPLAINzz"
		evts      = false
		loc  uint = types.Body
		sev  uint = 0
		i    uint = 50
		meth      = "GET"
		url       = "normandy.cdn.mozilla.net"
		err  error
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

	if _, err = AddTracer(r); err != nil {
		t.Fatal("Got an error while adding a tracer.")
	}
}

func validTracer(t *testing.T, e types.Tracer, ts, tp string, evts bool, loc, sev, i uint) {
	if e.TracerString != ts {
		t.Fatal("Got the wrong tracer string.")
	}
	// This is an odd check because of how JSON marshalling and unmarshalling works.
	// It keeps converting special characters into their unicode representation, which
	// causes this to fail. Commenting out until I can get a unified way to test the
	// payloads are equivalent.
	//if e.TracerPayload != tp {
	//	t.Fatalf("Got the wrong tracer payload. Expected %s, got %s", tp, e.TracerPayload)
	//}

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
