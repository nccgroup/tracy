package tracer

import (
	"database/sql"
	"encoding/json"
)

type Tracer struct {
	ID     int 				`json:"ID"`
	TracerString string 	`json:"TracerString"`
	URL    JsonNullString 	`json:"URL"`
	Method JsonNullString 	`json:"Method"`
	Hits   []TracerEvent 	`json:"Events"`
}

type TracerEvent struct {
	ID        JsonNullInt64 	`json:"ID"`
	Data      JsonNullString	`json:"Data"`
	Location  JsonNullString	`json:"Location"`
	EventType JsonNullString	`json:"EventType"`
}

/* Idea taken from https://stackoverflow.com/questions/33072172/how-can-i-work-with-sql-null-values-and-json-in-golang-in-a-good-way */
type JsonNullInt64 struct {
	sql.NullInt64
}

func (v JsonNullInt64) MarshalJSON() ([]byte, error) {
    if v.Valid {
        return json.Marshal(v.Int64)
    } else {
        return json.Marshal(nil)
    }
}

func (v *JsonNullInt64) UnmarshalJSON(data []byte) error {
    // Unmarshalling into a pointer will let us detect null
    var x *int64
    if err := json.Unmarshal(data, &x); err != nil {
        return err
    }
    if x != nil {
        v.Valid = true
        v.Int64 = *x
    } else {
        v.Valid = false
    }
    return nil
}

/* Idea taken from https://stackoverflow.com/questions/33072172/how-can-i-work-with-sql-null-values-and-json-in-golang-in-a-good-way */
type JsonNullString struct {
	sql.NullString
}

func (v JsonNullString) MarshalJSON() ([]byte, error) {
    if v.Valid {
        return json.Marshal(v.String)
    } else {
        return json.Marshal(nil)
    }
}

func (v *JsonNullString) UnmarshalJSON(data []byte) error {
    // Unmarshalling into a pointer will let us detect null
    var x *string
    if err := json.Unmarshal(data, &x); err != nil {
        return err
    }
    if x != nil {
        v.Valid = true
        v.String = *x
    } else {
        v.Valid = false
    }
    return nil
}