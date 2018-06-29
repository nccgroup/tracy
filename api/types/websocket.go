package types

// TracerWebSocket is a struct that is used to pass new tracer data back to clients
// connected to the websocket server.
type TracerWebSocket struct {
	Tracers Tracer `json:"Tracer"`
}

// RequestWebSocket is a struct that is used to pass new request data back to
// clients connected to the websocket server.
type RequestWebSocket struct {
	Requests Request `json:"Request"`
}

// TracerEventsWebSocket is a struct that is used to pass new tracer events data
// back to clients connected to the websocket server.
type TracerEventsWebSocket struct {
	TracerEvents TracerEvent `json:"TracerEvent"`
}
