package store

import (
	"database/sql"
	"fmt"
	/* Chosing this library because it implements the golang stdlin database
	 * sql interface. */
	_ "github.com/mattn/go-sqlite3"
	"log"
	"xxterminator-plugin/xxterminate/TracerServer/types"
)

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
		return types.Tracer{}, err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(t.TracerString, t.URL, t.Method)
	if err != nil {
		return types.Tracer{}, err
	}

	/* Check the response. */
	lastID, err := res.LastInsertId()
	if err != nil {
		return types.Tracer{}, err
	}

	/* Make sure one row was inserted. */
	rowCnt, err := res.RowsAffected()
	if err != nil {
		return types.Tracer{}, err
	}
	log.Printf("AddTracer: ID = %d, affected = %d\n", lastID, rowCnt)

	/* Pull the record that was just added and return it. */
	trcr, err := DBGetTracerByID(db, int(lastID))
	if err != nil {
		return types.Tracer{}, err
	}

	/* Return the inserted tracer and nil to indicate no problems. */
	return trcr, nil
}

/*DBGetTracers gets all the trcrs. */
func DBGetTracers(db *sql.DB) (map[int]types.Tracer, error) {
	//trcrs.id, trcrs.method, trcrs.trcrStr, trcrs.URL, events.event_data, events.location, events.event_type
	query := fmt.Sprintf(
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s
		 FROM %s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 LEFT JOIN %s ON %s.%s = %s.%s;`,
		/* Select values. */
		TracersTable, TracersIDColumn,
		TracersTable, TracersMethodColumn,
		TracersTable, TracersTracerStringColumn,
		EventsTable, EventsIDColumn,
		TracersTable, TracersURLColumn,
		EventsTable, EventsDataColumn,
		EventsTable, EventsLocationColumn,
		EventsTable, EventsEventTypeColumn,
		/* From this table. */
		TracersTable,
		/*Join this table where the tracer IDs match. */
		TracersEventsTable, TracersEventsTable, TracersEventsTracerIDColumn,
		TracersTable, TracersIDColumn,
		/* Join again against the events table where the event IDs match. */
		EventsTable, EventsTable, EventsIDColumn,
		TracersEventsTable, TracersEventsEventIDColumn)
	log.Printf("Built this query for getting trcrs: %s\n", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		return nil, err
	}

	/* Query the database for the  */
	rows, err := stmt.Query()
	if err != nil {
		return nil, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why I can't get the number of rows from a Rows type. Kind of annoying. */
	trcrs := make(map[int]types.Tracer)
	for rows.Next() {
		var (
			trcrID   int
			evntID   types.JSONNullInt64
			trcrStr  string
			URL      types.JSONNullString
			method   types.JSONNullString
			data     types.JSONNullString
			location types.JSONNullString
			etype    types.JSONNullString
		)

		/* Scan the row. */
		err = rows.Scan(&trcrID, &method, &trcrStr, &evntID, &URL, &data, &location, &etype)
		if err != nil {
			/* Fail fast if this messes up. */
			return nil, err
		}

		/* Check if the tracer is already in the map. */
		var trcr types.Tracer
		if val, ok := trcrs[trcrID]; ok {
			/* Get the tracer from the map. */
			trcr = val
		} else {
			/* Build a tracer struct from the data. */
			trcr = types.Tracer{
				ID:           trcrID,
				TracerString: trcrStr,
				URL:          URL,
				Method:       method,
				Hits:         make([]types.TracerEvent, 0)}
		}

		/* Build a TracerEvent struct from the data. */
		trcrEvnt := types.TracerEvent{}
		if evntID.Int64 != 0 && data != (types.JSONNullString{}) {
			trcrEvnt = types.TracerEvent{
				ID:        evntID,
				Data:      data,
				Location:  location,
				EventType: etype,
			}
			/* Add the trcrEvnt to the  */
			trcr.Hits = append(trcr.Hits, trcrEvnt)
		}

		/* Replace the tracer in the map. */
		trcrs[trcrID] = trcr
	}

	/* Not sure why we need to check for errors again, but this was from the
	 * Golang examples. Checking for errors during iteration.*/
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	/* Return the tracer and nil to indicate everything went okay. */
	return trcrs, nil
}

/*DBDeleteTracer deletes a specific tracer by the ID. */
func DBDeleteTracer(db *sql.DB, id int) error {
	/* Using prepared statements. */
	query := fmt.Sprintf(`
		DELETE from %s 
		WHERE %s = ?;`, TracersTable, TracersIDColumn)
	log.Printf("Built this query for deleting a tracer: %s\n", query)
	stmt, err := db.Prepare(query)

	if err != nil {
		return err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(id)
	if err != nil {
		return err
	}

	/* Check the response. */
	lastID, err := res.LastInsertId()
	if err != nil {
		return err
	}

	/* Make sure one row was inserted. */
	rowCnt, err := res.RowsAffected()
	if err != nil {
		return err
	}
	log.Printf("DeleteTracer: ID = %d, affected = %d\n", lastID, rowCnt)

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

	log.Printf("Built this query for deleting a tracer: %s\n", query)
	stmt, err := db.Prepare(query)

	if err != nil {
		return types.Tracer{}, err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(trcr.TracerString, trcr.Method, trcr.URL, id)
	if err != nil {
		return types.Tracer{}, err
	}

	/* Check the response. */
	lastID, err := res.LastInsertId()
	if err != nil {
		return types.Tracer{}, err
	}

	/* Make sure one row was inserted. */
	rowCnt, err := res.RowsAffected()
	if err != nil {
		return types.Tracer{}, err
	}
	log.Printf("EditTracer: ID = %d, affected = %d\n", lastID, rowCnt)

	updated, err := DBGetTracerByID(db, int(lastID))
	if err != nil {
		return types.Tracer{}, err
	}

	/* Return the inserted tracer and nil to indicate no problems. */
	return updated, nil
}

/*DBGetTracerIDByName gets a tracer by their tracer name. This will exclude
 * any joins with other tables. */
func DBGetTracerIDByName(db *sql.DB, trcrStr string) (int, error) {
	query := fmt.Sprintf(
		`SELECT %s.%s
		FROM %s
		WHERE %s.%s = ?;`,
		TracersTable, TracersIDColumn,
		TracersTable,
		TracersTable, TracersTracerStringColumn)
	log.Printf("Built this query for getting a tracer id by name: %s\n", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		return 0, err
	}

	/* Query the database for the  */
	rows, err := stmt.Query(trcrStr)
	if err != nil {
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
			/* Fail fast if this messes up. */
			return 0, err
		}
	}

	return trcrID, nil
}

/*DBGetTracerByTracerString gets a tracer by the tracer string. */
func DBGetTracerByTracerString(db *sql.DB, trcrStr string) (types.Tracer, error) {
	//trcrs.id, trcrs.method, trcrs.trcrStr, trcrs.URL, events.event_data, events.location, events.event_type
	query := fmt.Sprintf(
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s
		 FROM %s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 WHERE %s.%s = ?;`,
		/* Select values. */
		TracersTable, TracersIDColumn,
		TracersTable, TracersMethodColumn,
		TracersTable, TracersTracerStringColumn,
		EventsTable, EventsIDColumn,
		TracersTable, TracersTracerStringColumn,
		EventsTable, EventsDataColumn,
		EventsTable, EventsLocationColumn,
		EventsTable, EventsEventTypeColumn,
		/* From this table. */
		TracersTable,
		/* Join this table where the tracer IDs match. */
		EventsTable, TracersTable, TracersIDColumn,
		EventsTable, TracersEventsTracerIDColumn,
		/* Join again against the events table where the event IDs match. */
		EventsTable, EventsTable, TracersEventsEventIDColumn,
		EventsTable, EventsIDColumn,
		/* Where clause. */
		TracersTable, TracersTracerStringColumn)
	log.Printf("Built this query for getting a tracer: %s\n", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		return types.Tracer{}, err
	}

	/* Query the database for the  */
	rows, err := stmt.Query(trcrStr)
	if err != nil {
		return types.Tracer{}, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why I can't get the number of rows from a Rows type. Kind of annoying. */
	trcr := types.Tracer{}
	for rows.Next() {
		var (
			trcrID   int
			evntID   types.JSONNullInt64
			trcrStr  string
			URL      types.JSONNullString
			method   types.JSONNullString
			data     types.JSONNullString
			location types.JSONNullString
			etype    types.JSONNullString
		)

		/* Scan the row. */
		err = rows.Scan(&trcrID, &method, &trcrStr, &evntID, &URL, &data, &location, &etype)
		if err != nil {
			/* Fail fast if this messes up. */
			return types.Tracer{}, err
		}

		/* Check if the tracer hasn't been initialized. */
		if trcr.Method.String == "" {
			/* Build a tracer struct from the data. */
			trcr = types.Tracer{
				ID:           trcrID,
				TracerString: trcrStr,
				URL:          URL,
				Method:       method,
				Hits:         make([]types.TracerEvent, 0)}
		}

		/* Build a TracerEvent struct from the data. */
		trcrEvnt := types.TracerEvent{}
		if evntID.Int64 != 0 && data != (types.JSONNullString{}) {
			log.Printf("Event ID: %d\n", evntID)
			trcrEvnt = types.TracerEvent{
				ID:        evntID,
				Data:      data,
				Location:  location,
				EventType: etype,
			}
			/* Add the trcrEvnt to the  */
			trcr.Hits = append(trcr.Hits, trcrEvnt)
		}

	}

	/* Not sure why we need to check for errors again, but this was from the
	 * Golang examples. Checking for errors during iteration.*/
	err = rows.Err()
	if err != nil {
		return types.Tracer{}, err
	}

	/* Return the tracer and nil to indicate everything went okay. */
	return trcr, nil
}

/*DBGetTracerByID gets a tracer by the tracer ID. */
func DBGetTracerByID(db *sql.DB, id int) (types.Tracer, error) {
	//trcrs.id, trcrs.method, trcrs.trcrStr, trcrs.URL, events.event_data, events.location, events.event_type
	query := fmt.Sprintf(
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s
		 FROM %s
		 LEFT JOIN %s ON %s.%s = %s.%s
		 LEFT JOIN %s ON %s.%s = %s.%s
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
		/* From this table. */
		TracersTable,
		/* Join this table where the tracer IDs match. */
		TracersEventsTable, TracersTable, TracersIDColumn, TracersEventsTable, TracersEventsTracerIDColumn,
		/* Join again against the events table where the event IDs match. */
		EventsTable, TracersEventsTable, TracersEventsEventIDColumn, EventsTable, EventsIDColumn,
		/* Where clause. */
		TracersTable, TracersIDColumn)
	log.Printf("Built this query for getting a tracer: %s\n", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		return types.Tracer{}, err
	}

	/* Query the database for the  */
	rows, err := stmt.Query(id)
	if err != nil {
		return types.Tracer{}, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why I can't get the number of rows from a Rows type. Kind of annoying. */
	trcr := types.Tracer{}
	for rows.Next() {
		var (
			trcrID   int
			evntID   types.JSONNullInt64
			method   types.JSONNullString
			trcrStr  string
			URL      types.JSONNullString
			data     types.JSONNullString
			location types.JSONNullString
			etype    types.JSONNullString
		)

		/* Scan the row. */
		err = rows.Scan(&trcrID, &method, &trcrStr, &evntID, &URL, &data, &location, &etype)
		if err != nil {
			/* Fail fast if this messes up. */
			return types.Tracer{}, err
		}

		/* Check if the tracer hasn't been initialized. */
		if trcr.Method.String == "" {
			/* Build a tracer struct from the data. */
			trcr = types.Tracer{
				ID:           trcrID,
				TracerString: trcrStr,
				URL:          URL,
				Method:       method,
				Hits:         make([]types.TracerEvent, 0)}
		}

		if evntID.Int64 != 0 && data != (types.JSONNullString{}) {
			/* Build a TracerEvent struct from the data. */
			trcrEvnt := types.TracerEvent{}
			log.Printf("Event ID: %d\n", evntID)
			trcrEvnt = types.TracerEvent{
				ID:        evntID,
				Data:      data,
				Location:  location,
				EventType: etype,
			}
			/* Add the trcrEvnt to the  */
			trcr.Hits = append(trcr.Hits, trcrEvnt)
		}

	}

	/* Not sure why we need to check for errors again, but this was from the
	 * Golang examples. Checking for errors during iteration.*/
	err = rows.Err()
	if err != nil {
		return types.Tracer{}, err
	}

	/* Return the tracer and nil to indicate everything went okay. */
	return trcr, nil
}
