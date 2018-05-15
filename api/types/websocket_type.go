package types

type TracerWebSocket struct {
	Tracers Tracer `json:"Tracer"`
}

type RequestWebSocket struct {
	Requests Request `json:"Request"`
}

type TracerEventsWebSocket struct {
	TracerEvents TracerEvent `json:"TracerEvent"`
}
