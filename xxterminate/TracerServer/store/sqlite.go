package store

import (
	"database/sql"
	/* Chosing this library because it implements the golang stdlin database
	 * sql interface. */
	"fmt"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"os"
)

/*TracersTable is the database table name for tracers. */
const TracersTable string = "tracers"

/*EventsTable is the database table name for tracer events. */
const EventsTable string = "events"

/*TracersEventsTable is the database table name for the mapping of tracers to events. */
const TracersEventsTable string = "tracers_events"

/*TracersIDColumn is the column name for the tracers ID. */
const TracersIDColumn string = "id"

/*TracersTracerStringColumn is the column name for the tracers tracer string. */
const TracersTracerStringColumn string = "tracer_string"

/*TracersURLColumn is the column name for the tracers URL. */
const TracersURLColumn string = "url"

/*TracersMethodColumn is the column name for the tracers method. */
const TracersMethodColumn string = "method"

/*EventsIDColumn is the column name for the tracer method. */
const EventsIDColumn string = "id"

/*EventsDataColumn is the column name for the tracer method. */
const EventsDataColumn string = "data"

/*EventsLocationColumn is the column name for the tracer method. */
const EventsLocationColumn string = "location"

/*EventsEventTypeColumn is the column name for the tracer method. */
const EventsEventTypeColumn string = "event_type"

/*TracersEventsIDColumn is the column name for the tracers events ID. */
const TracersEventsIDColumn string = "id"

/*TracersEventsTracerIDColumn is the column name for the tracers events tracer ID. */
const TracersEventsTracerIDColumn string = "tracer_id"

/*TracersEventsEventIDColumn is the column name for the tracers events event ID. */
const TracersEventsEventIDColumn string = "event_id"

/*TracerDB is the one global used to gain access to the database from this package.
 * Other packages, like testing, might choose to not use this database and instead
 * will supply their own. */
var TracerDB *sql.DB

/*Open the database and create the tables if they aren't already created.
 * Errors indicate something incorrectly happened while
 * connecting. Don't forget to close this DB when finished using it. */
func Open(driver, path string) (*sql.DB, error) {
	/* Create the file if it doesn't exist. */
	var _, err = os.Stat(path)

	if os.IsNotExist(err) {
		var file, err = os.Create(path)
		if err != nil {
			return nil, err
		}
		/* No need to defer. Close it right away. */
		file.Close()
	}

	log.Printf("Opening this database file: %s\n", path)

	/* Open the database. */
	db, err := sql.Open(driver, path)

	/* Check if there are no errors. */
	if err != nil {
		/* Throw the error up. */
		return nil, err
	}

	/* Validate the database is available by pinging it. */
	err = db.Ping()
	if err != nil {
		/* Throw the error up. */
		return db, err
	}

	/* Build the tables. */
	tracersTable := make(map[string]string)
	tracersTable[TracersTracerStringColumn] = "TEXT NOT NULL UNIQUE"
	tracersTable[TracersURLColumn] = "TEXT NOT NULL"
	tracersTable[TracersMethodColumn] = "TEXT NOT NULL"

	eventsTable := make(map[string]string)
	eventsTable[EventsDataColumn] = "TEXT"
	eventsTable[EventsLocationColumn] = "TEXT"
	eventsTable[EventsEventTypeColumn] = "TEXT"

	/* Simple ID-to-ID mapping between the two tables above. */
	tracersEventsTable := make(map[string]string)
	tracersEventsTable[TracersEventsTracerIDColumn] = "Integer"
	tracersEventsTable[TracersEventsEventIDColumn] = "Integer"

	/* Create table does not overwrite existing data, so perform this call every time
	 * we open the database. */
	createTable(db, TracersTable, tracersTable)
	createTable(db, EventsTable, eventsTable)
	createTable(db, TracersEventsTable, tracersEventsTable)

	/* Return the database and nil, indicating we made a sound connection. */
	TracerDB = db
	return db, nil
}

/* Create the tracer database. */
func createTable(db *sql.DB, tableName string, columns map[string]string) error {
	/* Create the front part of the query. */
	query := fmt.Sprintf("CREATE TABLE IF NOT EXISTS %s (id INTEGER PRIMARY KEY", tableName)
	for key, val := range columns {
		query = fmt.Sprintf("%s,", query)
		query = fmt.Sprintf("%s %s %s", query, key, val)
	}
	/* Close it up. */
	query = fmt.Sprintf("%s);", query)
	log.Printf("Built this query for creating tables: %s\n", query)

	/* Using prepared statements. */
	stmt, err := db.Prepare(query)
	if err != nil {
		return err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Check the table was created.*/
	res, err := stmt.Exec()
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
	log.Printf("CREATE TABLE %s: ID = %d, affected = %d\n", tableName, lastID, rowCnt)
	return nil
}
