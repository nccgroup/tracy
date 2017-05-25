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

///There is a huge problem here of overwriting meaniful trace data. we should change this to be a hash of the data plus a function of the location or something like that
func (t Tracer) LogEvent(te TracerEvent) {
	//tr.Hits[te.Location+te.EventType] = te
}