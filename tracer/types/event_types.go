package types

/*TracerEvent is an event that marks when a particular tracer was viewed again. */
type TracerEvent struct {
	ID        JSONNullInt64   `json:"ID"`
	Data      JSONNullString  `json:"Data"`
	Location  JSONNullString  `json:"Location"`
	EventType JSONNullString  `json:"EventType"`
	Contexts  []EventsContext `json:"Contexts"`
}
