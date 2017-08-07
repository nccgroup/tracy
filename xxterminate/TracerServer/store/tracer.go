package store

import (
	"database/sql"
	/* Chosing this library because it implements the golang stdlin database
	 * sql interface. */
	_ "github.com/mattn/go-sqlite3"
	"xxterminator-plugin/xxterminate/TracerServer/tracer"
	"log"
	"fmt"
)

/* Prepared statement for adding a tracer. */
func AddTracer(db *sql.DB, t tracer.Tracer) (tracer.Tracer, error) {
	/* Using prepared statements. */
	stmt, err := db.Prepare(fmt.Sprintf(`
	INSERT INTO %s 
		(%s, %s, %s)
	VALUES
		(?, ?, ?);`, TRACERS_TABLE, TRACERS_TRACER_STRING_COLUMN, TRACERS_URL_COLUMN, TRACERS_METHOD_COLUMN))

	if err != nil {
		return tracer.Tracer{}, err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(t.TracerString, t.URL, t.Method)
	if err != nil {
		return tracer.Tracer{}, err
	}
	
	/* Check the response. */
	lastId, err := res.LastInsertId()
	if err != nil {
		return tracer.Tracer{}, err
	}

	/* Make sure one row was inserted. */
	rowCnt, err := res.RowsAffected()
	if err != nil {
		return tracer.Tracer{}, err
	}
	log.Printf("AddTracer: ID = %d, affected = %d\n", lastId, rowCnt)

	/* Otherwise, return nil to indicate everything went okay. */
	trcr, err := GetTracerById(db, int(lastId))
	if err != nil {
		return tracer.Tracer{}, err
	}

	/* Return the inserted tracer and nil to indicate no problems. */
	return trcr, nil
}

/* Prepared statement for adding an event to a slice of tracers specified by the
 * the tracer string. */
func AddTracerEvent(db *sql.DB, te tracer.TracerEvent, ts []string) error {
	/* Using prepared statements. */
	query := fmt.Sprintf(`
	INSERT INTO %s 
		(%s, %s, %s)
	VALUES
		(?, ?, ?);`, EVENTS_TABLE, EVENTS_DATA_COLUMN, EVENTS_LOCATION_COLUMN, EVENTS_EVENT_TYPE_COLUMN)
	log.Printf("Built this query for adding a tracer event: %s\n", query)
	stmt, err := db.Prepare(query)

	if err != nil {
		return err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(te.Data, te.Location, te.EventType)
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
	log.Printf("AddTracerEvent: ID = %d, affected = %d\n", lastId, rowCnt)

	/* Then, for each tracer string, add an associate to the tracers events table. */
	for _, val := range ts {
		/* Get the tracer associated with that key string. */
		id, err := GetTracerIdByName(db, val)
		if err != nil {
			return err
		}
		/* We start at 1, so this shouldn't happen. */
		if id == 0 {
			return fmt.Errorf("Could not find a tracer with tracer string %s\n", val)
		}
		err = AddTracersEvents(db, int(lastId), id)
		if err != nil {
			return err
		}

	}

	/* Otherwise, return nil to indicate everything went okay. */
	return nil
}

/* Prepared statement for adding to the tracers events table. */
func AddTracersEvents(db *sql.DB, tei, ti int) error {
	/* Using prepared statements. */
	query := fmt.Sprintf(`
	INSERT INTO %s 
		(%s, %s)
	VALUES
		(?, ?);`, TRACERS_EVENTS_TABLE, TRACERS_EVENTS_TRACER_ID_COLUMN, TRACERS_EVENTS_EVENT_ID_COLUMN)
	log.Printf("Built this query for adding a tracers events row (%d,%d): %s\n", ti, tei, query)
	stmt, err := db.Prepare(query)

	if err != nil {
		return err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(ti, tei)
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
	log.Printf("AddTracersEvents: ID = %d, affected = %d\n", lastId, rowCnt)

	/* Otherwise, return nil to indicate everything went okay. */
	return nil
}

/* Prepared statement for getting a tracer by their tracer name. This will exclude
 * any joins with other tables. */
func GetTracerIdByName(db *sql.DB, tracer_string string) (int, error) {
	query := fmt.Sprintf(
		`SELECT %s.%s
		FROM %s
		WHERE %s.%s = ?;`,
		TRACERS_TABLE, TRACERS_ID_COLUMN,
		TRACERS_TABLE,
		TRACERS_TABLE, TRACERS_TRACER_STRING_COLUMN)
	log.Printf("Built this query for getting a tracer id by name: %s\n", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		return 0, err
	}

	/* Query the database for the tracer. */
	rows, err := stmt.Query(tracer_string)
	if err != nil {
		return 0, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	var (
		tracer_id int
	)
	for rows.Next() {

		/* Scan the row. */
		err = rows.Scan(&tracer_id)
		if err != nil {
			/* Fail fast if this messes up. */
			return 0, err
		}
	}

	return tracer_id, nil
}

/* Prepared statement for getting a tracer by the tracer string. */
func GetTracer(db *sql.DB, tracer_string string) (tracer.Tracer, error) {
	//tracers.id, tracers.method, tracers.tracer_string, tracers.url, events.event_data, events.location, events.event_type
	query := fmt.Sprintf(
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s
		 FROM %s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 WHERE %s.%s = ?;`, 
		 /* Select values. */
		 TRACERS_TABLE, TRACERS_ID_COLUMN,
		 TRACERS_TABLE, TRACERS_METHOD_COLUMN,
		 TRACERS_TABLE, TRACERS_TRACER_STRING_COLUMN,
		 EVENTS_TABLE, EVENTS_ID_COLUMN,
		 TRACERS_TABLE, TRACERS_URL_COLUMN,
		 EVENTS_TABLE, EVENTS_DATA_COLUMN,
		 EVENTS_TABLE, EVENTS_LOCATION_COLUMN,
		 EVENTS_TABLE, EVENTS_EVENT_TYPE_COLUMN,
		 /* From this table. */
		 TRACERS_TABLE,
		 /* Join this table where the tracer IDs match. */
		 TRACERS_EVENTS_TABLE, TRACERS_TABLE, TRACERS_ID_COLUMN, TRACERS_EVENTS_TABLE, TRACERS_EVENTS_TRACER_ID_COLUMN,
		 /* Join again against the events table where the event IDs match. */
		 EVENTS_TABLE, TRACERS_EVENTS_TABLE, TRACERS_EVENTS_EVENT_ID_COLUMN, EVENTS_TABLE, EVENTS_ID_COLUMN,
		 /* Where clause. */
		 TRACERS_TABLE, TRACERS_TRACER_STRING_COLUMN)
	log.Printf("Built this query for getting a tracer: %s\n", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		return tracer.Tracer{}, err
	}

	/* Query the database for the tracer. */
	rows, err := stmt.Query(tracer_string)
	if err != nil {
		return tracer.Tracer{}, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why I can't get the number of rows from a Rows type. Kind of annoying. */
	trcr := tracer.Tracer{}
	for rows.Next() {
		var (
			tracer_id int
			event_id tracer.JsonNullInt64
			tracer_str string
			url tracer.JsonNullString
			method tracer.JsonNullString
			data tracer.JsonNullString
			location tracer.JsonNullString
			etype tracer.JsonNullString
		)

		/* Scan the row. */
		err = rows.Scan(&tracer_id, &method, &tracer_str, &event_id, &url, &data, &location, &etype)
		if err != nil {
			/* Fail fast if this messes up. */
			return tracer.Tracer{}, err
		}

		/* Check if the tracer hasn't been initialized. */
		if trcr.Method.String == "" {
			/* Build a tracer struct from the data. */
			trcr = tracer.Tracer{
				ID: tracer_id,
				TracerString: tracer_str, 
				URL: url,
				Method: method,
				Hits: make([]tracer.TracerEvent, 0)}
		}

		/* Build a TracerEvent struct from the data. */
		tracer_event := tracer.TracerEvent{}
		if event_id.Int64 != 0 {
			log.Printf("Event ID: %d\n", event_id)
			tracer_event = tracer.TracerEvent{
				ID: event_id,
				Data: data,
				Location: location,
				EventType: etype,
			}
		}

		/* Add the tracer_event to the tracer. */
		trcr.Hits = append(trcr.Hits, tracer_event)
	}

	/* Not sure why we need to check for errors again, but this was from the 
	 * Golang examples. Checking for errors during iteration.*/
	 err = rows.Err()
	 if err != nil {
	 	return tracer.Tracer{}, err
	 }

	/* Return the tracer and nil to indicate everything went okay. */
	return trcr, nil
}

/* Prepared statement for getting a tracer by the tracer string. */
func GetTracerById(db *sql.DB, id int) (tracer.Tracer, error) {
	//tracers.id, tracers.method, tracers.tracer_string, tracers.url, events.event_data, events.location, events.event_type
	query := fmt.Sprintf(
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s
		 FROM %s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 WHERE %s.%s = ?;`, 
		 /* Select values. */
		 TRACERS_TABLE, TRACERS_ID_COLUMN,
		 TRACERS_TABLE, TRACERS_METHOD_COLUMN,
		 TRACERS_TABLE, TRACERS_TRACER_STRING_COLUMN,
		 EVENTS_TABLE, EVENTS_ID_COLUMN,
		 TRACERS_TABLE, TRACERS_URL_COLUMN,
		 EVENTS_TABLE, EVENTS_DATA_COLUMN,
		 EVENTS_TABLE, EVENTS_LOCATION_COLUMN,
		 EVENTS_TABLE, EVENTS_EVENT_TYPE_COLUMN,
		 /* From this table. */
		 TRACERS_TABLE,
		 /* Join this table where the tracer IDs match. */
		 TRACERS_EVENTS_TABLE, TRACERS_TABLE, TRACERS_ID_COLUMN, TRACERS_EVENTS_TABLE, TRACERS_EVENTS_TRACER_ID_COLUMN,
		 /* Join again against the events table where the event IDs match. */
		 EVENTS_TABLE, TRACERS_EVENTS_TABLE, TRACERS_EVENTS_EVENT_ID_COLUMN, EVENTS_TABLE, EVENTS_ID_COLUMN,
		 /* Where clause. */
		 TRACERS_TABLE, TRACERS_ID_COLUMN)
	log.Printf("Built this query for getting a tracer: %s\n", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		return tracer.Tracer{}, err
	}

	/* Query the database for the tracer. */
	rows, err := stmt.Query(id)
	if err != nil {
		return tracer.Tracer{}, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why I can't get the number of rows from a Rows type. Kind of annoying. */
	trcr := tracer.Tracer{}
	for rows.Next() {
		var (
			tracer_id int
			event_id tracer.JsonNullInt64
			tracer_str string
			url tracer.JsonNullString
			method tracer.JsonNullString
			data tracer.JsonNullString
			location tracer.JsonNullString
			etype tracer.JsonNullString
		)

		/* Scan the row. */
		err = rows.Scan(&tracer_id, &method, &tracer_str, &event_id, &url, &data, &location, &etype)
		if err != nil {
			/* Fail fast if this messes up. */
			return tracer.Tracer{}, err
		}

		/* Check if the tracer hasn't been initialized. */
		if trcr.Method.String == "" {
			/* Build a tracer struct from the data. */
			trcr = tracer.Tracer{
				ID: tracer_id,
				TracerString: tracer_str, 
				URL: url,
				Method: method,
				Hits: make([]tracer.TracerEvent, 0)}
		}

		if event_id.Int64 != 0 && data != (tracer.JsonNullString{}) {
			/* Build a TracerEvent struct from the data. */
			tracer_event := tracer.TracerEvent{}
			log.Printf("Event ID: %d\n", event_id)
			tracer_event = tracer.TracerEvent{
				ID: event_id,
				Data: data,
				Location: location,
				EventType: etype,
			}
			/* Add the tracer_event to the tracer. */
			trcr.Hits = append(trcr.Hits, tracer_event)
		}

	}

	/* Not sure why we need to check for errors again, but this was from the 
	 * Golang examples. Checking for errors during iteration.*/
	 err = rows.Err()
	 if err != nil {
	 	return tracer.Tracer{}, err
	 }

	/* Return the tracer and nil to indicate everything went okay. */
	return trcr, nil
}

/* Prepared statement for getting all the tracers. */
func GetTracers(db *sql.DB) (map[int]tracer.Tracer, error) {
	//tracers.id, tracers.method, tracers.tracer_string, tracers.url, events.event_data, events.location, events.event_type
	query := fmt.Sprintf(
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s
		 FROM %s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 LEFT JOIN %s ON %s.%s = %s.%s;`, 
		 /* Select values. */
		 TRACERS_TABLE, TRACERS_ID_COLUMN,
		 TRACERS_TABLE, TRACERS_METHOD_COLUMN,
		 TRACERS_TABLE, TRACERS_TRACER_STRING_COLUMN,
		 EVENTS_TABLE, EVENTS_ID_COLUMN,
		 TRACERS_TABLE, TRACERS_URL_COLUMN,
		 EVENTS_TABLE, EVENTS_DATA_COLUMN,
		 EVENTS_TABLE, EVENTS_LOCATION_COLUMN,
		 EVENTS_TABLE, EVENTS_EVENT_TYPE_COLUMN,
		 /* From this table. */
		 TRACERS_TABLE,
		 /*Join this table where the tracer IDs match. */
		 TRACERS_EVENTS_TABLE, TRACERS_TABLE, TRACERS_ID_COLUMN, TRACERS_EVENTS_TABLE, TRACERS_EVENTS_TRACER_ID_COLUMN,
		 /* Join again against the events table where the event IDs match. */
		 EVENTS_TABLE, TRACERS_EVENTS_TABLE, TRACERS_EVENTS_EVENT_ID_COLUMN, EVENTS_TABLE, EVENTS_ID_COLUMN)
	log.Printf("Built this query for getting tracers: %s\n", query)
	stmt, err := db.Prepare(query)
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
	tracers := make(map[int]tracer.Tracer, 0)
	for rows.Next() {
		var (
			tracer_id int
			event_id tracer.JsonNullInt64
			tracer_str string
			url tracer.JsonNullString
			method tracer.JsonNullString
			data tracer.JsonNullString
			location tracer.JsonNullString
			etype tracer.JsonNullString
		)

		/* Scan the row. */
		err = rows.Scan(&tracer_id, &method, &tracer_str, &event_id, &url, &data, &location, &etype)
		if err != nil {
			/* Fail fast if this messes up. */
			return nil, err
		}

		/* Check if the tracer is already in the map. */
		var trcr tracer.Tracer
		if val, ok := tracers[tracer_id]; ok {
			/* Get the tracer from the map. */
			trcr = val
		} else {
			/* Build a tracer struct from the data. */
			trcr = tracer.Tracer{
				ID: tracer_id,
				TracerString: tracer_str, 
				URL: url,
				Method: method,
				Hits: make([]tracer.TracerEvent, 0)}
		}

		/* Build a TracerEvent struct from the data. */
		tracer_event := tracer.TracerEvent{}
		if event_id.Int64 != 0 {
			tracer_event = tracer.TracerEvent{
				ID: event_id,
				Data: data,
				Location: location,
				EventType: etype,
			}
		}

		/* Add the tracer_event to the tracer. */
		trcr.Hits = append(trcr.Hits, tracer_event)
		/* Replace the tracer in the map. */
		tracers[tracer_id] = trcr
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
	query := fmt.Sprintf(`
		DELETE from %s 
		WHERE %s = ?;`, TRACERS_TABLE, TRACERS_TRACER_STRING_COLUMN)
	log.Printf("Built this query for deleting a tracer: %s\n", query)
	stmt, err := db.Prepare(query)

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