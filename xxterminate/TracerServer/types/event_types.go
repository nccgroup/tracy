package types

import (
	"database/sql"
	"encoding/json"
)

/*TracerEvent is an event that marks when a particular tracer was viewed again. */
type TracerEvent struct {
	ID        JSONNullInt64  `json:"ID"`
	Data      JSONNullString `json:"Data"`
	Location  JSONNullString `json:"Location"`
	EventType JSONNullString `json:"EventType"`
}

/*JSONNullInt64 allows us to write our own JSON decode/encode functions so that null
 * values are properly handled from the sqlite database without throwing errors.
 * This is especially useful when a tracer doesn't have any tracer events and the
 * join query will return nil. */
type JSONNullInt64 struct {
	sql.NullInt64
} //Idea taken from https://stackoverflow.com/questions/33072172/how-can-i-work-with-sql-null-values-and-json-in-golang-in-a-good-way

/*MarshalJSON is a function to implement json.Marshaller so we can use the normal
 * json APIs to package up this data correctly. */
func (v JSONNullInt64) MarshalJSON() ([]byte, error) {
	var ret []byte
	var err error
	if v.Valid {
		ret, err = json.Marshal(v.Int64)
	} else {
		ret, err = json.Marshal(nil)
	}

	return ret, err
}

/*UnmarshalJSON is a function to implement json.Unarshaller so we can use the normal
 * json APIs to unpackage this data correctly. */
func (v *JSONNullInt64) UnmarshalJSON(data []byte) error {
	/* Unmarshalling into a pointer will let us detect null. */
	var x *int64
	var err error
	err = json.Unmarshal(data, &x)
	if x != nil {
		v.Valid = true
		v.Int64 = *x
	} else {
		v.Valid = false
	}
	return err
}

/*JSONNullString allows us to write our own JSON decode/encode functions so that null
 * values are properly handled from the sqlite database without throwing errors.
 * This is especially useful when a tracer doesn't have any tracer events and the
 * join query will return nil. */
type JSONNullString struct {
	sql.NullString
} // Idea taken from https://stackoverflow.com/questions/33072172/how-can-i-work-with-sql-null-values-and-json-in-golang-in-a-good-way

/*MarshalJSON is a function to implement json.Marshaller so we can use the normal
 * json APIs to package up this data correctly. */
func (v JSONNullString) MarshalJSON() ([]byte, error) {
	var ret []byte
	var err error
	if v.Valid {
		ret, err = json.Marshal(v.String)
	} else {
		ret, err = json.Marshal(nil)
	}

	return ret, err
}

/*UnmarshalJSON is a function to implement json.Unarshaller so we can use the normal
 * json APIs to unpackage this data correctly. */
func (v *JSONNullString) UnmarshalJSON(data []byte) error {
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
