package store

import (
	"database/sql"
	"fmt"
	/* Chosing this library because it implements the golang stdlin database
	 * sql interface. */
	"crypto/sha1"
	"encoding/hex"
	_ "github.com/mattn/go-sqlite3"
	"tracy/log"
	"tracy/tracer/types"
)

/*DBAddTracerEvent adds an event to a slice of tracers specified by the the tracer string. */
func DBAddTracerEvent(db *sql.DB, te types.TracerEvent, ts string) (types.TracerEvent, error) {
	/* Using prepared statements. */
	query := fmt.Sprintf(`
	INSERT INTO %s 
		(%s, %s, %s, %s)
	VALUES
		(?, ?, ?, ?);`,
		EventsTable,
		EventsDataColumn, EventsLocationColumn, EventsEventTypeColumn, EventsDataHashColumn)
	log.Trace.Printf("Built this query for adding a tracer event: %s", query)
	stmt, err := db.Prepare(query)

	if err != nil {
		log.Warning.Printf(err.Error())
		return types.TracerEvent{}, err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Commute the hash of the data so we can compare the event to other events. */
	sum := sha1.Sum([]byte(te.Data.String + ts))
	sumStr := hex.EncodeToString(sum[:len(sum)])
	/* Execute the query. */
	res, err := stmt.Exec(te.Data, te.Location, te.EventType, sumStr)
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

	/* Get the tracer associated with that key string. */
	id, err := DBGetTracerIDByTracerString(db, ts)
	if err != nil {
		return types.TracerEvent{}, err
	}
	/* We start at 1, so this shouldn't happen. */
	if id == 0 {
		return types.TracerEvent{}, fmt.Errorf("could not find a tracer with tracer string %s", ts)
	}
	/* Associate to the tracers events table. */
	err = DBAddTracersEvents(db, int(lastID), id)
	if err != nil {
		return types.TracerEvent{}, err
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
		`SELECT %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s, %s.%s
		 FROM %s
		 LEFT JOIN %s on %s.%s = %s.%s
		 WHERE %s.%s = ?;`,
		EventsTable, EventsIDColumn, EventsTable, EventsDataColumn, EventsTable, EventsLocationColumn,
		EventsTable, EventsEventTypeColumn, EventsContextTable, EventsContextIDColumn,
		EventsContextTable, EventsContextDataColumn, EventsContextTable, EventsContextLocationTypeColumn,
		EventsContextTable, EventsContextNodeNameColumn,
		EventsTable, EventsContextTable, EventsContextTable, EventsContextEventID, EventsTable,
		EventsIDColumn, EventsTable, EventsIDColumn)
	log.Trace.Printf("Built this query for getting a tracer: %s, id: %d", query, tei)
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

	/* Not sure why we need to check for errors again, but this was from the
	 * Golang examples. Checking for errors during iteration.*/
	err = rows.Err()
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.TracerEvent{}, err
	}

	trcrEvnt, err := parseEventsFromSQLRows(rows)
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

/* Helper function for parsing tracer rows with event data as well. */
func parseEventsFromSQLRows(rows *sql.Rows) (types.TracerEvent, error) {
	ret := types.TracerEvent{}
	for rows.Next() {
		var (
			eventID                  types.JSONNullInt64
			eventData                types.JSONNullString
			eventLocation            types.JSONNullString
			eventType                types.JSONNullString
			eventContextID           types.JSONNullInt64
			eventContextContext      types.JSONNullString
			eventContextLocationtype types.JSONNullInt64
			eventContextNodeName     types.JSONNullString
		)

		err := rows.Scan(&eventID, &eventData, &eventLocation, &eventType, &eventContextID,
			&eventContextContext, &eventContextLocationtype, &eventContextNodeName)
		if err != nil {
			log.Warning.Printf(err.Error())
			/* Fail fast if this messes up. */
			return types.TracerEvent{}, err
		}

		/* Initial case to fill the event. */
		if len(ret.Contexts) == 0 {
			/* Check if the tracer is already in the map. */
			ret = types.TracerEvent{
				ID:        eventID,
				Data:      eventData,
				Location:  eventLocation,
				EventType: eventType,
				Contexts:  make([]types.EventsContext, 0),
			}
		}

		if eventContextID.Int64 != 0 && eventContextContext != (types.JSONNullString{}) {
			/* Build a EventContext struct from the data. */
			trcrContext := types.EventsContext{
				ID:           eventContextID,
				Context:      eventContextContext,
				LocationType: eventContextLocationtype,
				NodeName:     eventContextNodeName,
			}
			ret.Contexts = append(ret.Contexts, trcrContext)
		}
	}

	return ret, nil
}
