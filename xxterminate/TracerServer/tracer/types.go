package tracer

type Tracer struct {
	ID     int
	TracerString string
	URL    string
	Method string
	Hits   []TracerEvent
}

type TracerEvent struct {
	ID        int
	Data      string
	Location  string
	EventType string
}