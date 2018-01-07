package types

/*EventsContext is an event that marks when a particular tracer was viewed again. */
type EventsContext struct {
	ID           JSONNullInt64  `json:"ID"`
	Context      JSONNullString `json:"Context"`
	LocationType JSONNullInt64  `json:"Location"`
	NodeName     JSONNullString `json:"NodeName"`
}
