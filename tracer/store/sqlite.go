package store

import (
	"database/sql"
	"fmt"
	/* Chosing this library because it implements the golang stdlin database
	 * sql interface. */
	_ "github.com/mattn/go-sqlite3"
	"os"
	"xxterminator-plugin/log"
)

/*TracersTable is the database table name for tracers. */
const TracersTable string = "tracers"

/*EventsTable is the database table name for tracer events. */
const EventsTable string = "events"

/*TracersEventsTable is the database table name for the mapping of tracers to events. */
const TracersEventsTable string = "tracers_events"

/*EventsContextTable is the database table that contains the context information for a particular event. */
const EventsContextTable string = "events_context"

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

/*EventsDataHashColumn is the column name for the tracer method. */
const EventsDataHashColumn string = "event_data_hash"

/*TracersEventsIDColumn is the column name for the tracers events ID. */
const TracersEventsIDColumn string = "id"

/*TracersEventsTracerIDColumn is the column name for the tracers events tracer ID. */
const TracersEventsTracerIDColumn string = "tracer_id"

/*TracersEventsEventIDColumn is the column name for the tracers events event ID. */
const TracersEventsEventIDColumn string = "event_id"

/*EventsContextIDColumn is the column for the ID field of the events context ID. */
const EventsContextIDColumn string = "id"

/*EventsContextDataColumn is the column for the data fields of the events context. */
const EventsContextDataColumn string = "events_context_data"

/*EventsContextLocationTypeColumn is the column for the location fields of the events context. */
const EventsContextLocationTypeColumn string = "events_context_location"

/*EventsContextNodeNameColumn is the column for the node name fields of the events context. */
const EventsContextNodeNameColumn string = "events_context_node_name"

/*EventsContextEventID is the column for the event ID which links the table with the events table. */
const EventsContextEventID string = "events_context_event_id"

/*LabelsTable is the table name for the labels table. */
const LabelsTable string = "labels"

/*LabelsIDColumn is the ID column name for the labels table. */
const LabelsIDColumn string = "id"

/*LabelsTracerColumn is the tracer string column name for the labels table. */
const LabelsTracerColumn string = "labels_tracer"

/*LabelsTracerPayloadColumn is the payload column name for the labels table. */
const LabelsTracerPayloadColumn string = "labels_tracer_payload"

/*TracerDB is the one global used to gain access to the database from this package.
 * Other packages, like testing, might choose to not use this database and instead
 * will supply their own. */
var TracerDB *sql.DB

/*Open the database and create the tables if they aren't already created.
 * Errors indicate something incorrectly happened while
 * connecting. Don't forget to close this DB when finished using it. */
func Open(driver, path string) (*sql.DB, error) {
	/* Create the file if it doesn't exist. */
	if _, err := os.Stat(path); os.IsNotExist(err) {
		log.Trace.Printf("Creating a database file. Couldn't find it.")
		var file, err = os.Create(path)
		if err != nil {
			return nil, err
		}
		/* No need to defer. Close it right away. */
		file.Close()
	}

	/* Open the database. */
	log.Trace.Printf("Opening this database file: %s\n", path)
	db, err := sql.Open(driver, path)

	/* Check if there are no errors. */
	if err != nil {
		log.Warning.Printf(err.Error())
		/* Throw the error up. */
		return nil, err
	}

	/* We want to disable the goroutine thread pool that is used by default since this application doesn't need it and will
	 * cause performance issues. https://stackoverflow.com/questions/35804884/sqlite-concurrent-writing-performance */
	db.SetMaxOpenConns(1)

	/* Validate the database is available by pinging it. */
	err = db.Ping()
	if err != nil {
		log.Warning.Printf(err.Error())
		/* Throw the error up. */
		return db, err
	}

	/* Build the tables. */
	tracersTable := make(map[string]string)
	tracersTable[TracersTracerStringColumn] = "TEXT NOT NULL UNIQUE"
	tracersTable[TracersURLColumn] = "TEXT NOT NULL"
	tracersTable[TracersMethodColumn] = "TEXT NOT NULL"

	/* Simple ID-to-ID mapping between the two tables above. */
	tracersEventsTable := make(map[string]string)
	tracersEventsTable[TracersEventsTracerIDColumn] = "Integer"
	tracersEventsTable[TracersEventsEventIDColumn] = "Integer"

	/* Mapping of an event to the numerous contexts it can have per URL. */
	eventsContextTable := make(map[string]string)
	eventsContextTable[EventsContextDataColumn] = "TEXT NOT NULL"
	eventsContextTable[EventsContextLocationTypeColumn] = "Integer"
	eventsContextTable[EventsContextNodeNameColumn] = "TEXT NOT NULL"
	eventsContextTable[EventsContextEventID] = "Integer"

	labelsTable := make(map[string]string)
	labelsTable[LabelsTracerColumn] = "TEXT NOT NULL UNIQUE"
	labelsTable[LabelsTracerPayloadColumn] = "TEXT NOT NULL"

	/* Create table does not overwrite existing data, so perform this call every time
	 * we open the database. */
	err = createTable(db, TracersTable, tracersTable)
	if err == nil {
		err = createTable(db, TracersEventsTable, tracersEventsTable)
		if err == nil {
			/* Do this one by hand so we can properly do the unique constraints. */
			err = execAndHandleErrors(db, fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s 
				(id INTEGER PRIMARY KEY, 
					%s TEXT, 
					%s TEXT, 
					%s TEXT,
					%s TEXT,
					UNIQUE (%s, %s));`,
				EventsTable, EventsDataColumn, EventsEventTypeColumn, EventsDataHashColumn,
				EventsLocationColumn, EventsDataHashColumn, EventsLocationColumn))

			if err == nil {
				err = createTable(db, EventsContextTable, eventsContextTable)
				if err == nil {
					err = createTable(db, LabelsTable, labelsTable)
				}
			}
		}
	}

	/* Return the database and nil, indicating we made a sound connection. */
	TracerDB = db
	return db, err
}

/* Create the tracer database. */
func createTable(db *sql.DB, tableName string, columns map[string]string) error {
	/* Create the front part of the query. */
	query := fmt.Sprintf("CREATE TABLE IF NOT EXISTS %s (id INTEGER PRIMARY KEY", tableName)
	for key, val := range columns {
		query = fmt.Sprintf("%s,", query)
		query = fmt.Sprintf("%s %s %s", query, key, val)
	}

	return execAndHandleErrors(db, query)
}

func execAndHandleErrors(db *sql.DB, query string) error {
	/* Close it up. */
	query = fmt.Sprintf("%s);", query)
	log.Trace.Printf("Built this query for creating tables: %s\n", query)

	/* Using prepared statements. */
	stmt, err := db.Prepare(query)
	if err != nil {
		log.Warning.Printf(err.Error())
		return err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Check the table was created.*/
	res, err := stmt.Exec()
	if err != nil {
		log.Warning.Printf(err.Error())
		return err
	}

	/* Check the response. */
	_, err = res.LastInsertId()
	if err != nil {
		log.Warning.Printf(err.Error())
		return err
	}

	/* Make sure one row was inserted. */
	_, err = res.RowsAffected()
	if err != nil {
		log.Warning.Printf(err.Error())
		return err
	}

	/* Add the WAL pragma. This configuration helps with performance issues related to concurrent writers. */
	pragmaStmt, err := db.Prepare("PRAGMA journal_mode=WAL")
	if err != nil {
		log.Warning.Printf(err.Error())
		return err
	}
	defer pragmaStmt.Close()

	_, err = pragmaStmt.Exec()
	if err != nil {
		log.Warning.Printf(err.Error())
		return err
	}

	return nil
}
