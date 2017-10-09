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

/*DBAddTracerEvent adds an event to a slice of tracers specified by the the tracer string. */
func DBAddTracerEvent(db *sql.DB, te types.TracerEvent, ts []string) (types.TracerEvent, error) {
	/* Using prepared statements. */
	query := fmt.Sprintf(`
	INSERT INTO %s 
		(%s, %s, %s)
	VALUES
		(?, ?, ?);`, EventsTable, EventsDataColumn,
		EventsLocationColumn, EventsEventTypeColumn)
	log.Trace.Printf("Built this query for adding a tracer event: %s", query)
	stmt, err := db.Prepare(query)

	if err != nil {
		log.Warning.Printf(err.Error())
		return types.TracerEvent{}, err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(te.Data, te.Location, te.EventType)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.TracerEvent{}, err
	}

	/* Check the response. */
	lastID, err := res.LastInsertId()
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.TracerEvent{}, err
	}

	/* Make sure one row was inserted. */
	rowCnt, err := res.RowsAffected()
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.TracerEvent{}, err
	}
	log.Trace.Printf("AddTracerEvent: ID = %d, affected = %d", lastID, rowCnt)

	/* Then, for each tracer string, add an associate to the tracers events table. */
	for _, val := range ts {
		/* Get the tracer associated with that key string. */
		id, err := DBGetTracerIDByTracerString(db, val)
		if err != nil {
			return types.TracerEvent{}, err
		}
		/* We start at 1, so this shouldn't happen. */
		if id == 0 {
			return types.TracerEvent{}, fmt.Errorf("could not find a tracer with tracer string %s", val)
		}
		err = DBAddTracersEvents(db, int(lastID), id)
		if err != nil {
			return types.TracerEvent{}, err
		}

	}

	trcrEvnt, err := DBGetTracerEventByID(db, int(lastID))
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.TracerEvent{}, err
	}

	/* Otherwise, return nil to indicate everything went okay. */
	return trcrEvnt, nil
}

/*DBGetTracerEventByID gets a tracer event by the tracer event ID. */
func DBGetTracerEventByID(db *sql.DB, tei int) (types.TracerEvent, error) {
	query := fmt.Sprintf(
		`SELECT %s, %s, %s, %s
		 FROM %s
		 WHERE %s = ?;`,
		EventsIDColumn,
		EventsDataColumn,
		EventsLocationColumn,
		EventsEventTypeColumn,
		EventsTable,
		EventsIDColumn)
	log.Trace.Printf("Built this query for getting a tracer: %s", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.TracerEvent{}, err
	}
	defer stmt.Close()

	/* Query the database for the types. */
	rows, err := stmt.Query(tei)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.TracerEvent{}, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why I can't get the number of rows from a Rows type. Kind of annoying. */
	trcrEvnt := types.TracerEvent{}
	for rows.Next() {
		var (
			eventID  types.JSONNullInt64
			data     types.JSONNullString
			location types.JSONNullString
			etype    types.JSONNullString
		)

		/* Scan the row. */
		err = rows.Scan(&eventID, &data, &location, &etype)
		if err != nil {
			log.Warning.Printf(err.Error())
			/* Fail fast if this messes up. */
			return types.TracerEvent{}, err
		}

		if eventID.Int64 != 0 && data != (types.JSONNullString{}) {
			log.Trace.Printf("Event ID: %d", eventID.Int64)
			trcrEvnt = types.TracerEvent{
				ID:        eventID,
				Data:      data,
				Location:  location,
				EventType: etype,
			}
		}
	}

	/* Not sure why we need to check for errors again, but this was from the
	 * Golang examples. Checking for errors during iteration.*/
	err = rows.Err()
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.TracerEvent{}, err
	}

	/* Validate we have an event. */
	if trcrEvnt.ID.Int64 != int64(tei) {
		log.Warning.Printf("No tracer event with ID %d", tei)
		return types.TracerEvent{}, nil
	}

	/* Return the tracer event and nil to indicate everything went okay. */
	return trcrEvnt, nil
}

/*DBAddTracersEvents adds an entry to the tracers events table. */
func DBAddTracersEvents(db *sql.DB, tei, ti int) error {
	/* Using prepared statements. */
	query := fmt.Sprintf(`
	INSERT INTO %s 
		(%s, %s)
	VALUES
		(?, ?);`, TracersEventsTable, TracersEventsTracerIDColumn,
		TracersEventsEventIDColumn)
	log.Trace.Printf("Built this query for adding a tracers events row (%d,%d): %s", ti, tei, query)
	stmt, err := db.Prepare(query)

	if err != nil {
		log.Warning.Printf(err.Error())
		return err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(ti, tei)
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
	log.Trace.Printf("AddTracersEvents: ID = %d, affected = %d", lastID, rowCnt)

	/* Otherwise, return nil to indicate everything went okay. */
	return nil
}
