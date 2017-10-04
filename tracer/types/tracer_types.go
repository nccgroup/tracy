package types

/*Tracer is a marker for input into the application. This will be used to find outputs. */
type Tracer struct {
	ID           int            `json:"ID"`
	TracerString string         `json:"TracerString"`
	URL          JSONNullString `json:"URL"`
	Method       JSONNullString `json:"Method"`
	Hits         []TracerEvent  `json:"Events"`
}
