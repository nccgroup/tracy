package tracer

type Tracer struct {
	ID     int
	TracerString string
	URL    string
	Method string
	Hits   map[string]TracerEvent
}

type TracerEvent struct {
	ID        int //ok This is silly to add this here we should know the id but for now I am adding it because it makes it easy to	
	TracerString string
	Data      string
	Location  string
	EventType string
}

///There is a huge problem here of overwriting meaniful trace data. we should change this to be a hash of the data plus a function of the location or something like that
func (t Tracer) LogEvent(te TracerEvent) {
	//tr.Hits[te.Location+te.EventType] = te
}