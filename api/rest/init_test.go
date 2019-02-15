package rest

import (
	"net/http"
	"testing"

	"github.com/gorilla/mux"
	"github.com/nccgroup/tracy/configure"
)

func TestUIRoutesNoProxy(t *testing.T) {
	var table = []struct {
		method        string
		url           string
		expectedRoute string
		hoot          bool
	}{
		{http.MethodGet, "http://127.0.0.1:7777", "webUI", false},
		{http.MethodGet, "http://127.0.0.1:7777/", "webUI", false},
		{http.MethodGet, "http://tracy/", "tracyHost", false},
		{http.MethodGet, "http://localhost:7777", "webUI", false},
		{http.MethodGet, "http://google.com", "proxy", false},
		// TODO: need to make new tests for options because of how things changed
		//		{http.MethodOptions, "http://127.0.0.1:7777/api/tracy/projects", "projects", },
		//		{http.MethodOptions, "http://localhost:7777/api/tracy/projects", "projects", false},
		{http.MethodPost, "http://127.0.0.1:7777/api/tracy/tracers", "/tracers", true},
		//		{http.MethodPut, "http://127.0.0.1:7777/api/tracy/tracers/1", "/tracers/{tracerID}", true},
		{http.MethodGet, "http://127.0.0.1:7777/api/tracy/tracers/generate", "/tracers/generate", true},
		{http.MethodGet, "http://127.0.0.1:7777/api/tracy/tracers/1/request", "/tracers/{tracerID}/request", true},
		{http.MethodGet, "http://127.0.0.1:7777/api/tracy/tracers/1", "/tracers/{tracerID}", true},
		{http.MethodGet, "http://127.0.0.1:7777/api/tracy/tracers", "/tracers", true},
		{http.MethodPost, "http://127.0.0.1:7777/api/tracy/tracers/1/events", "/tracers/{tracerID}/events", true},
		{http.MethodGet, "http://127.0.0.1:7777/api/tracy/tracers/1/events", "/tracers/{tracerID}/events", true},
		{http.MethodPost, "http://127.0.0.1:7777/api/tracy/tracers/1/events/1/reproductions", "/tracers/{tracerID}/events/{contextID}/reproductions", true},
		{http.MethodPut, "http://127.0.0.1:7777/api/tracy/tracers/1/events/1/reproductions/1", "/tracers/{tracerID}/events/{contextID}/reproductions/{reproID}", true},
		{http.MethodPost, "http://127.0.0.1:7777/api/tracy/tracers/events/bulk", "/tracers/events/bulk", true},
		{http.MethodGet, "http://127.0.0.1:7777/api/tracy/config", "/config", true},
		{http.MethodPut, "http://127.0.0.1:7777/api/tracy/projects", "/projects", true},
		{http.MethodDelete, "http://127.0.0.1:7777/api/tracy/projects", "/projects", true},
		{http.MethodGet, "http://127.0.0.1:7777/api/tracy/projects", "/projects", true},
		{http.MethodGet, "http://127.0.0.1:7777/ws", "websocket", false},
	}

	for _, row := range table {
		m := &mux.RouteMatch{}
		r, err := http.NewRequest(row.method, row.url, nil)
		if err != nil {
			t.Fatal(err)
		}
		if row.hoot {
			r.Header.Add("Hoot", "!")
		}
		if Router.Match(r, m) {
			expected := row.expectedRoute
			if row.hoot {
				expected = row.method + ":" + expected
			}
			if expected != m.Route.GetName() {
				t.Fatalf("%s matched route %s; expected %s",
					row.url, m.Route.GetName(), expected)
			}
		} else {
			t.Fatalf("The route didn't match: %+v", r)
		}
	}
}

func init() {
	configure.Setup()
	Configure()
}
