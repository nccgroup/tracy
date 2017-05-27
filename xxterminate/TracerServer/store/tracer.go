package store

import (
	"database/sql"
	/* Chosing this library because it implements the golang stdlin database
	 * sql interface. */
	_ "github.com/mattn/go-sqlite3"
	"xxterminator-plugin/xxterminate/TracerServer/tracer"
	"log"
	"fmt"
	"os"
)

/* Prepared statement for adding a tracer. */
func AddTracer(db *sql.DB, t tracer.Tracer) error {
	/* Using prepared statements. */
	stmt, err := db.Prepare(fmt.Sprintf(`
	INSERT INTO %s 
		(%s, %s, %s)
	VALUES
		(?, ?, ?);`, TRACERS_TABLE, TRACERS_TRACER_STRING_COLUMN, TRACERS_URL_COLUMN, TRACERS_METHOD_COLUMN))

	if err != nil {
		return err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(t.TracerString, t.URL, t.Method)
	if err != nil {
		return err
	}
	
	/* Check the response. */
	lastId, err := res.LastInsertId()
	if err != nil {
		return err
	}

	/* Make sure one row was inserted. */
	rowCnt, err := res.RowsAffected()
	if err != nil {
		return err
	}
	log.Printf("AddTracer: ID = %d, affected = %d\n", lastId, rowCnt)

	/* Otherwise, return nil to indicate everything went okay. */
	return nil
}

/* Prepared statement for getting a tracer. */
func GetTracer(db *sql.DB, tracer_string string) (tracer.Tracer, error) {
//tracers.id, tracers.method, tracers.tracer_string, tracers.url, events.event_data, events.location, events.event_type
	stmt, err := db.Prepare(fmt.Sprintf(
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s
		 FROM %s
		 INNER JOIN %s WHERE %s.%s = %s.%s
		 INNER JOIN %s WHERE %s.%s = %s.%s
		 WHERE %s.%s = ?;`, 
		 /* Select values. */
		 TRACERS_TABLE, TRACERS_ID_COLUMN,
		 TRACERS_TABLE, TRACERS_METHOD_COLUMN,
		 TRACERS_TABLE, TRACERS_TRACER_STRING_COLUMN,
		 TRACERS_TABLE, TRACERS_URL_COLUMN,
		 EVENTS_TABLE, EVENTS_DATA_COLUMN,
		 EVENTS_TABLE, EVENTS_LOCATION_COLUMN,
		 EVENTS_TABLE, EVENTS_EVENT_TYPE_COLUMN,
		 /* From this table. */
		 TRACERS_TABLE,
		 /* Inner join this table where the tracer IDs match. */
		 TRACERS_EVENTS_TABLE, TRACERS_TABLE, TRACERS_ID_COLUMN, TRACERS_EVENTS_TABLE, TRACERS_EVENTS_TRACER_ID_COLUMN
		 /* Inner join again against the events table where the event IDs match. */
		 EVENTS_TABLE, TRACERS_EVENTS_TABLE, TRACERS_EVENTS_EVENT_ID_COLUMN, EVENTS_TABLE, EVENT_ID_COLUMN
		 /* Where clause. */
		 TRACERS_TABLE, TRACERS_TRACER_STRING_COLUMN))
	if err != nil {
		return nil, err
	}

	/* Query the database for the tracer. */
	rows, err := stmt.Query(tracer_string)
	if err != nil {
		return nil, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why I can't get the number of rows from a Rows type. Kind of annoying. */
	tracers := make([int]tracer.Tracer, 0)
	for rows.Next() {
		var (
			tracer_id int
			event_id int
			tracer_str string
			url string
			method string
			data string
			location string
			etype string
		)

		/* Scan the row. */
		err = rows.Scan(&tracer_id, &method, &tracer_str, &event_id, &url, &data, &location, &etype)
		if err != nil {
			/* Fail fast if this messes up. */
			return nil, err
		}

		/* Check if the tacer is already in the map. */
		var tracer tracer.Tracer
		if !in-tracer-map {
			/* Build a tracer struct from the data. */
			tracer = tracer.Tracer{
				ID: id,
				TracerString: tracer_str, 
				URL: url, 
				Method: method,
				Hits: make([]tracer.Tracer)}
		} else {
			/* Get the tracer from the map. */
			tracer = tracers[id]
		}

		/* Build a TracerEvent struct from the data. */
		tracer_event := tracer.TracerEvent{
			ID: event_id,
			Data: data,
			Location: location,
			EventType: etype
		}

		/* Add the tracer_event to the tracer. */
		tracer.Hits = append(tracer.Hits, tracer_event)
		/* Replace the tracer in the map. */
		tracers[id] = tracer
	}

	/* Not sure why we need to check for errors again, but this was from the 
	 * Golang examples. Checking for errors during iteration.*/
	 err = rows.Err()
	 if err != nil {
	 	return nil, err
	 }

	/* Return the tracer and nil to indicate everything went okay. */
	return tracers, nil
}

/* Prepared statement for getting all the tracers. */
func GetTracers(db *sql.DB) ([]tracer.Tracer, error) {
	//tracers.id, tracers.method, tracers.tracer_string, tracers.url, events.event_data, events.location, events.event_type
	stmt, err := db.Prepare(fmt.Sprintf(
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s
		 FROM %s
		 INNER JOIN %s WHERE %s.%s = %s.%s
		 INNER JOIN %s WHERE %s.%s = %s.%s;`, 
		 /* Select values. */
		 TRACERS_TABLE, TRACERS_ID_COLUMN,
		 TRACERS_TABLE, TRACERS_METHOD_COLUMN,
		 TRACERS_TABLE, TRACERS_TRACER_STRING_COLUMN,
		 TRACERS_TABLE, TRACERS_URL_COLUMN,
		 EVENTS_TABLE, EVENTS_DATA_COLUMN,
		 EVENTS_TABLE, EVENTS_LOCATION_COLUMN,
		 EVENTS_TABLE, EVENTS_EVENT_TYPE_COLUMN,
		 /* From this table. */
		 TRACERS_TABLE,
		 /* Inner join this table where the tracer IDs match. */
		 TRACERS_EVENTS_TABLE, TRACERS_TABLE, TRACERS_ID_COLUMN, TRACERS_EVENTS_TABLE, TRACERS_EVENTS_TRACER_ID_COLUMN
		 /* Inner join again against the events table where the event IDs match. */
		 EVENTS_TABLE, TRACERS_EVENTS_TABLE, TRACERS_EVENTS_EVENT_ID_COLUMN, EVENTS_TABLE, EVENT_ID_COLUMN))
	if err != nil {
		return nil, err
	}

	/* Query the database for the tracer. */
	rows, err := stmt.Query()
	if err != nil {
		return nil, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why I can't get the number of rows from a Rows type. Kind of annoying. */
	tracers := make([int]tracer.Tracer, 0)
	for rows.Next() {
		var (
			tracer_id int
			event_id int
			tracer_str string
			url string
			method string
			data string
			location string
			etype string
		)

		/* Scan the row. */
		err = rows.Scan(&tracer_id, &method, &tracer_str, &event_id, &url, &data, &location, &etype)
		if err != nil {
			/* Fail fast if this messes up. */
			return nil, err
		}

		/* Check if the tacer is already in the map. */
		var tracer tracer.Tracer
		if !in-tracer-map {
			/* Build a tracer struct from the data. */
			tracer = tracer.Tracer{
				ID: id,
				TracerString: tracer_str, 
				URL: url, 
				Method: method,
				Hits: make([]tracer.Tracer)}
		} else {
			/* Get the tracer from the map. */
			tracer = tracers[id]
		}

		/* Build a TracerEvent struct from the data. */
		tracer_event := tracer.TracerEvent{
			ID: event_id,
			Data: data,
			Location: location,
			EventType: etype
		}

		/* Add the tracer_event to the tracer. */
		tracer.Hits = append(tracer.Hits, tracer_event)
		/* Replace the tracer in the map. */
		tracers[id] = tracer
	}

	/* Not sure why we need to check for errors again, but this was from the 
	 * Golang examples. Checking for errors during iteration.*/
	 err = rows.Err()
	 if err != nil {
	 	return nil, err
	 }

	/* Return the tracer and nil to indicate everything went okay. */
	return tracers, nil
}

/* Prepated statement for deleting a specific tracer. */
func DeleteTracer(db *sql.DB, tracerString string) error {
/* Using prepared statements. */
	stmt, err := db.Prepare(fmt.Sprintf(`
	DELETE from %s 
	WHERE %s = ?;`, TRACERS_TABLE, TRACERS_TRACER_STRING_COLUMN))

	if err != nil {
		return err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(tracerString)
	if err != nil {
		return err
	}
	
	/* Check the response. */
	lastId, err := res.LastInsertId()
	if err != nil {
		return err
	}

	/* Make sure one row was inserted. */
	rowCnt, err := res.RowsAffected()
	if err != nil {
		return err
	}
	log.Printf("DeleteTracer: ID = %d, affected = %d\n", lastId, rowCnt)

	/* Otherwise, return nil to indicate everything went okay. */
	return nil
}