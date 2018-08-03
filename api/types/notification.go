package types

// Notification is a struct used to notify listeners for major changes
// to tracers or their associated events.
type Notification struct {
	Tracer Tracer
	Event  TracerEvent
}
