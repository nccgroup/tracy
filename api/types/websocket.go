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

// NotificationWebSocket is a struct that is used to pass new notifications
// back to clients connected to the websocket server.
type NotificationWebSocket struct {
	Notification Notification `json:"Notification"`
}

// ReproductionWebSocket is a struct that is used to pass new
// reproduction data to the extension from the UI.x
type ReproductionWebSocket struct {
	Reproduction Reproduction `json:Reproduction`
}
