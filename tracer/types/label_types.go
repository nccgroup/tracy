package types

/*Label is a payload type that can be used by the extension. */
type Label struct {
	ID            JSONNullInt64  `json:"ID"`
	Tracer        JSONNullString `json:"Tracer"`
	TracerPayload JSONNullString `json:"TracerPayload"`
}
