package tracer

import "database/sql"

type Tracer struct {
	ID     int
	TracerString string
	URL    sql.NullString
	Method sql.NullString
	Hits   []TracerEvent
}

type TracerEvent struct {
	ID        sql.NullInt64
	Data      sql.NullString
	Location  sql.NullString
	EventType sql.NullString
}