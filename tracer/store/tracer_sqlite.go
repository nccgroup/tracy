package store

import (
	"database/sql"
	"fmt"
	/* Chosing this library because it implements the golang stdlin database
	 * sql interface. */
	_ "github.com/mattn/go-sqlite3"
	"xxterminator-plugin/log"
	"xxterminator-plugin/tracer/types"
)

func makeSliceFromMap(trcrs map[int]types.Tracer) []types.Tracer {
	ret := make([]types.Tracer, len(trcrs))
	i := 0
	for _, v := range trcrs {
		ret[i] = v
		i++
	}

	return ret
}

/*DBAddTracer adds a new tracer. */
func DBAddTracer(db *sql.DB, t types.Tracer) (types.Tracer, error) {
	/* Using prepared statements. */
	stmt, err := db.Prepare(fmt.Sprintf(`
	INSERT INTO %s 
		(%s, %s, %s)
	VALUES
		(?, ?, ?);`,
		TracersTable, TracersTracerStringColumn,
		TracersURLColumn, TracersMethodColumn))

	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(t.TracerString, t.URL, t.Method)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}

	/* Check the response. */
	lastID, err := res.LastInsertId()
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}

	/* Make sure one row was inserted. */
	rowCnt, err := res.RowsAffected()
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}
	log.Trace.Printf("AddTracer: ID = %d, affected = %d\n", lastID, rowCnt)

	/* Pull the record that was just added and return it. */
	trcr, err := DBGetTracerWithEventsByID(db, int(lastID))
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}

	/* Return the inserted tracer and nil to indicate no problems. */
	return trcr, nil
}

/*DBGetTracers gets all the tracers. */
func DBGetTracersWithEvents(db *sql.DB) ([]types.Tracer, error) {
	query := fmt.Sprintf(
		// trcrs.id, trcrs.method, trcrs.trcrStr, events.ID, trcrs.URL, events.event_data, events.location, events.event_type, events_context.ID, events_context.context, events_context.location_type, events_context.node_name
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s 
		 FROM %s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 LEFT JOIN %s on %s.%s = %s.%s;`,
		/* Select values. */
		TracersTable, TracersIDColumn,
		TracersTable, TracersMethodColumn,
		TracersTable, TracersTracerStringColumn,
		EventsTable, EventsIDColumn,
		TracersTable, TracersURLColumn,
		EventsTable, EventsDataColumn,
		EventsTable, EventsLocationColumn,
		EventsTable, EventsEventTypeColumn,
		EventsContextTable, EventsContextIDColumn,
		EventsContextTable, EventsContextDataColumn,
		EventsContextTable, EventsContextLocationTypeColumn,
		EventsContextTable, EventsContextNodeNameColumn,
		/* From this table. */
		TracersTable,
		/*Join this table where the tracer IDs match. */
		TracersEventsTable, TracersEventsTable, TracersEventsTracerIDColumn,
		TracersTable, TracersIDColumn,
		/* Join again against the events table where the event IDs match. */
		EventsTable, EventsTable, EventsIDColumn,
		TracersEventsTable, TracersEventsEventIDColumn,
		EventsContextTable, EventsContextTable, EventsContextEventID,
		EventsTable, EventsIDColumn)
	log.Trace.Printf("Built this query for getting trcrs: %s\n", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		log.Warning.Printf(err.Error())
		return nil, err
	}
	defer stmt.Close()

	/* Query the database for the  */
	rows, err := stmt.Query()
	if err != nil {
		log.Warning.Printf(err.Error())
		return nil, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	trcrs, err := parseTracersFromSQLRows(rows)

	if err != nil {
		log.Warning.Printf(err.Error())
		return nil, err
	}

	/* Return the tracer and nil to indicate everything went okay. */
	trcrsSlice := makeSliceFromMap(trcrs)

	return trcrsSlice, nil
}

/* Helper function to find out if an event is in a slice. */
func isIDInSlice(events []types.TracerEvent, id int) (int, bool) {
	retInt := -1
	retBool := false
	for k, v := range events {
		if int(v.ID.Int64) == id {
			retInt = k
			retBool = true
			break
		}
	}
	return retInt, retBool
}

/*DBGetTracers gets all the trcrs. */
func DBGetTracers(db *sql.DB) ([]types.Tracer, error) {
	//trcrs.id, trcrs.method, trcrs.trcrStr, trcrs.URL, events.event_data, events.location, events.event_type
	query := fmt.Sprintf(
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s
		 FROM %s`,
		/* Select values. */
		TracersTable, TracersIDColumn,
		TracersTable, TracersMethodColumn,
		TracersTable, TracersTracerStringColumn,
		TracersTable, TracersURLColumn,
		/* From this table. */
		TracersTable)
	log.Trace.Printf("Built this query for getting trcrs: %s\n", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		log.Warning.Printf(err.Error())
		return nil, err
	}
	defer stmt.Close()

	/* Query the database for the  */
	rows, err := stmt.Query()
	if err != nil {
		log.Warning.Printf(err.Error())
		return nil, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why I can't get the number of rows from a Rows type. Kind of annoying. */
	trcrs := make(map[int]types.Tracer)
	for rows.Next() {
		var (
			trcrID  int
			trcrStr string
			URL     types.JSONNullString
			method  types.JSONNullString
		)

		/* Scan the row. */
		err = rows.Scan(&trcrID, &method, &trcrStr, &URL)
		if err != nil {
			log.Warning.Printf(err.Error())
			/* Fail fast if this messes up. */
			return nil, err
		}

		/* Check if the tracer is already in the map. */
		trcr := types.Tracer{
			ID:           trcrID,
			TracerString: trcrStr,
			URL:          URL,
			Method:       method}

		/* Replace the tracer in the map. */
		trcrs[trcrID] = trcr
	}

	/* Not sure why we need to check for errors again, but this was from the
	 * Golang examples. Checking for errors during iteration.*/
	err = rows.Err()
	if err != nil {
		log.Warning.Printf(err.Error())
		return nil, err
	}
	/* Return the tracer and nil to indicate everything went okay. */
	trcrsSlice := makeSliceFromMap(trcrs)

	return trcrsSlice, nil
}

/*DBDeleteTracer deletes a specific tracer by the ID. */
func DBDeleteTracer(db *sql.DB, id int) error {
	/* Using prepared statements. */
	query := fmt.Sprintf(`
		DELETE from %s 
		WHERE %s = ?;`, TracersTable, TracersIDColumn)
	log.Trace.Printf("Built this query for deleting a tracer: %s\n", query)
	stmt, err := db.Prepare(query)

	if err != nil {
		log.Warning.Printf(err.Error())
		return err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(id)
	if err != nil {
		log.Warning.Printf(err.Error())
		return err
	}

	/* Check the response. */
	lastID, err := res.LastInsertId()
	if err != nil {
		log.Warning.Printf(err.Error())
		return err
	}

	/* Make sure one row was inserted. */
	rowCnt, err := res.RowsAffected()
	if err != nil {
		log.Warning.Printf(err.Error())
		return err
	}
	log.Trace.Printf("DeleteTracer: ID = %d, affected = %d\n", lastID, rowCnt)

	/* Otherwise, return nil to indicate everything went okay. */
	return nil
}

/*DBEditTracer edits a specific tracer.  */
func DBEditTracer(db *sql.DB, id int, trcr types.Tracer) (types.Tracer, error) {
	/* Using prepared statements. */
	query := fmt.Sprintf(`
		UPDATE %s 
		SET 
			%s = ?,
			%s = ?,
			%s = ?
		WHERE
			%s = ?`,
		TracersTable,
		TracersTracerStringColumn,
		TracersMethodColumn,
		TracersURLColumn,
		TracersIDColumn)

	log.Trace.Printf("Built this query for deleting a tracer: %s\n", query)
	stmt, err := db.Prepare(query)

	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(trcr.TracerString, trcr.Method, trcr.URL, id)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}

	/* Check the response. */
	lastID, err := res.LastInsertId()
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}

	/* Make sure one row was inserted. */
	rowCnt, err := res.RowsAffected()
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}
	log.Trace.Printf("EditTracer: ID = %d, affected = %d\n", lastID, rowCnt)

	updated, err := DBGetTracerWithEventsByID(db, int(lastID))
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}

	/* Return the inserted tracer and nil to indicate no problems. */
	return updated, nil
}

/*DBGetTracerIDByName gets a tracer by their tracer name. This will exclude
 * any joins with other tables. */
func DBGetTracerIDByTracerString(db *sql.DB, trcrStr string) (int, error) {
	query := fmt.Sprintf(
		`SELECT %s.%s
		FROM %s
		WHERE %s.%s = ?;`,
		TracersTable, TracersIDColumn,
		TracersTable,
		TracersTable, TracersTracerStringColumn)
	log.Trace.Printf("Built this query for getting a tracer id by name: %s\n", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		log.Warning.Printf(err.Error())
		return 0, err
	}
	defer stmt.Close()

	/* Query the database for the  */
	rows, err := stmt.Query(trcrStr)
	if err != nil {
		log.Warning.Printf(err.Error())
		return 0, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	var (
		trcrID int
	)
	for rows.Next() {

		/* Scan the row. */
		err = rows.Scan(&trcrID)
		if err != nil {
			log.Warning.Printf(err.Error())
			/* Fail fast if this messes up. */
			return 0, err
		}
	}

	return trcrID, nil
}

/*DBGetTracerByTracerString gets a tracer by the tracer string. */
func DBGetTracerWithEventsByTracerString(db *sql.DB, trcrStr string) (types.Tracer, error) {
	//trcrs.id, trcrs.method, trcrs.trcrStr, trcrs.URL, events.event_data, events.location, events.event_type
	query := fmt.Sprintf(
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s // trcrs.id, trcrs.method, trcrs.trcrStr, events.ID, trcrs.URL, events.event_data, events.location, events.event_type, events_context.ID, events_context.context, events_context.location_type, events_context.node_name
		 FROM %s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 LEFT JOIN %s on %s.%s = %s.%s
		 WHERE %s.%s = ?;`,
		/* Select values. */
		TracersTable, TracersIDColumn,
		TracersTable, TracersMethodColumn,
		TracersTable, TracersTracerStringColumn,
		EventsTable, EventsIDColumn,
		TracersTable, TracersURLColumn,
		EventsTable, EventsDataColumn,
		EventsTable, EventsLocationColumn,
		EventsTable, EventsEventTypeColumn,
		EventsContextTable, EventsContextIDColumn,
		EventsContextTable, EventsContextDataColumn,
		EventsContextTable, EventsContextLocationTypeColumn,
		EventsContextTable, EventsContextNodeNameColumn,
		/* From this table. */
		TracersTable,
		/*Join this table where the tracer IDs match. */
		TracersEventsTable, TracersEventsTable, TracersEventsTracerIDColumn,
		TracersTable, TracersIDColumn,
		/* Join again against the events table where the event IDs match. */
		EventsTable, EventsTable, EventsIDColumn,
		TracersEventsTable, TracersEventsEventIDColumn,
		EventsContextTable, EventsContextTable, EventsContextEventID,
		EventsTable, EventsIDColumn,
		/* Where clause. */
		TracersTable, TracersTracerStringColumn)
	log.Trace.Printf("Built this query for getting a tracer: %s\n", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}
	defer stmt.Close()

	/* Query the database for the  */
	rows, err := stmt.Query(trcrStr)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why I can't get the number of rows from a Rows type. Kind of annoying. */
	trcrs, err := parseTracersFromSQLRows(rows)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}

	for _, v := range trcrs {
		if v.TracerString == trcrStr {
			/* Return the tracer and nil to indicate everything went okay. */
			return v, nil
		}
	}

	err = fmt.Errorf("Should have only received one row and that row should have had the expected ID inside.")
	log.Warning.Printf(err.Error())
	return types.Tracer{}, err
}

/*DBGetTracerByID gets a tracer by the tracer ID. */
func DBGetTracerWithEventsByID(db *sql.DB, id int) (types.Tracer, error) {
	query := fmt.Sprintf(
		// trcrs.id, trcrs.method, trcrs.trcrStr, events.ID, trcrs.URL, events.event_data, events.location, events.event_type, events_context.ID, events_context.context, events_context.location_type, events_context.node_name
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s
		 FROM %s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 LEFT JOIN %s on %s.%s = %s.%s
		 WHERE %s.%s = ?;`,
		/* Select values. */
		TracersTable, TracersIDColumn,
		TracersTable, TracersMethodColumn,
		TracersTable, TracersTracerStringColumn,
		EventsTable, EventsIDColumn,
		TracersTable, TracersURLColumn,
		EventsTable, EventsDataColumn,
		EventsTable, EventsLocationColumn,
		EventsTable, EventsEventTypeColumn,
		EventsContextTable, EventsContextIDColumn,
		EventsContextTable, EventsContextDataColumn,
		EventsContextTable, EventsContextLocationTypeColumn,
		EventsContextTable, EventsContextNodeNameColumn,
		/* From this table. */
		TracersTable,
		/*Join this table where the tracer IDs match. */
		TracersEventsTable, TracersEventsTable, TracersEventsTracerIDColumn,
		TracersTable, TracersIDColumn,
		/* Join again against the events table where the event IDs match. */
		EventsTable, EventsTable, EventsIDColumn,
		TracersEventsTable, TracersEventsEventIDColumn,
		EventsContextTable, EventsContextTable, EventsContextEventID,
		EventsTable, EventsIDColumn,
		/* Where clause. */
		TracersTable, TracersIDColumn)
	log.Trace.Printf("Built this query for getting a tracer: %s, id: %d", query, id)
	stmt, err := db.Prepare(query)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}
	defer stmt.Close()

	/* Query the database for the  */
	rows, err := stmt.Query(id)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why I can't get the number of rows from a Rows type. Kind of annoying. */
	trcrs, err := parseTracersFromSQLRows(rows)

	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Tracer{}, err
	}

	if val, ok := trcrs[id]; ok {
		/* Return the tracer and nil to indicate everything went okay. */
		return val, nil
	} else {
		log.Warning.Printf("%+v: %s", trcrs, "Should have only received one row and that row should have had the expected ID inside.")
		/* Shouldn't return an error when a query returns no rows. If this is the case,
		 * just return an empty tracer struct.  */
		return types.Tracer{}, nil
	}
}

/* Helper function for parsing tracer rows with event data as well. */
func parseTracersFromSQLRows(rows *sql.Rows) (map[int]types.Tracer, error) {
	/* Not sure why we need to check for errors again, but this was from the
	 * Golang examples. Checking for errors during iteration.*/
	err := rows.Err()
	if err != nil {
		log.Warning.Printf(err.Error())
		return nil, err
	}
	ret := make(map[int]types.Tracer)
	for rows.Next() {
		var (
			trcrID                   int
			eventID                  types.JSONNullInt64
			trcrStr                  string
			URL                      types.JSONNullString
			method                   types.JSONNullString
			eventData                types.JSONNullString
			eventLocation            types.JSONNullString
			eventType                types.JSONNullString
			eventContextID           types.JSONNullInt64
			eventContextContext      types.JSONNullString
			eventContextLocationtype types.JSONNullInt64
			eventContextNodeName     types.JSONNullString
		)

		/* Scan the row. */
		err := rows.Scan(&trcrID, &method, &trcrStr, &eventID, &URL, &eventData,
			&eventLocation, &eventType, &eventContextID, &eventContextContext,
			&eventContextLocationtype, &eventContextNodeName)
		if err != nil {
			log.Warning.Printf(err.Error())
			/* Fail fast if this messes up. */
			return nil, err
		}

		/* Check if the tracer is already in the map. */
		var trcr types.Tracer
		if val, ok := ret[trcrID]; ok {
			/* Get the tracer from the map. */
			trcr = val
			log.Trace.Printf("The tracer was already found in the map: %+v", trcr)
		} else {
			/* Build a tracer struct from the data. */
			trcr = types.Tracer{
				ID:           trcrID,
				TracerString: trcrStr,
				URL:          URL,
				Method:       method,
				Events:       make([]types.TracerEvent, 0),
			}
			log.Trace.Printf("The tracer was not found in the map. Created this one: %+v", trcr)
		}

		/* Check if the current row's event ID is already in the struct. */
		var trcrEvnt types.TracerEvent
		idx, ok := isIDInSlice(trcr.Events, int(eventID.Int64))
		if ok {
			log.Trace.Printf("The ID %d was found at the %d position of the current tracer events.", int(eventID.Int64), idx)
			trcrEvnt = trcr.Events[idx]
		} else {
			/* Build a TracerEvent struct from the data. */
			trcrEvnt = types.TracerEvent{
				ID:        eventID,
				Data:      eventData,
				Location:  eventLocation,
				EventType: eventType,
				Contexts:  make([]types.EventsContext, 0),
			}
			log.Trace.Printf("The ID %d was not found in the list of current tracer events. Created this one: %+v", int(eventID.Int64), trcrEvnt)
			trcr.Events = append(trcr.Events, trcrEvnt)
			idx = len(trcr.Events) - 1
		}

		if eventContextID.Int64 != 0 && eventContextContext != (types.JSONNullString{}) {
			trcrContext := types.EventsContext{
				ID:           eventContextID,
				Context:      eventContextContext,
				LocationType: eventContextLocationtype,
				NodeName:     eventContextNodeName,
			}
			trcr.Events[idx].Contexts = append(trcr.Events[idx].Contexts, trcrContext)
		}

		/* Replace the tracer in the map. */
		ret[trcrID] = trcr
	}

	return ret, nil
}
