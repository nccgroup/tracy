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

/* Open the database and create the tables if they aren't already created. 
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
	tracers_table := make(map[string]string)
	tracers_table["tracer_string"] = "TEXT"
	tracers_table["url"] = "TEXT"
	tracers_table["method"] = "TEXT"

	/* TODO: not actually sure what needs to go into this table. */
	events_table := make(map[string]string)
	events_table["event_data"] = "TEXT"

	/* Simple ID-to-ID mapping between the two tables above. */
	tracers_events_table := make(map[string]string)
	tracers_events_table["tracer_id"] = "Integer"
	tracers_events_table["event_id"] = "Integer"

	/* Create table does not overwrite existing data, so perform this call every time
	 * we open the database. */
	createTable(db, "tracers", tracers_table)
	createTable(db, "events", events_table)
	createTable(db, "tracers_events", tracers_events_table)

	/* Return the database and nil, indicating we made a sound connection. */
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
	lastId, err := res.LastInsertId()
	if err != nil {
		return err
	}

	/* Make sure one row was inserted. */
	rowCnt, err := res.RowsAffected()
	if err != nil {
		return err
	}
	log.Printf("CREATE TABLE %s: ID = %d, affected = %d\n", tableName, lastId, rowCnt)
	return nil
}

/* Prepared statement for adding a tracer. */
func AddTracer(db *sql.DB, t tracer.Tracer) error {
	/* Using prepared statements. */
	stmt, err := db.Prepare(`
	INSERT INTO tracers 
		(tracer_string, url, method)
	VALUES
		(?, ?, ?);`)

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
func GetTracer(db *sql.DB, traver_string string) (tracer.Tracer, error) {
	stmt, err := db.Prepare(`
	SELECT * FROM tracers 
	WHERE tracer_string = ?;`)
	if err != nil {
		return tracer.Tracer{}, err
	}

	/* Query the database for the tracer. */
	var (
		id int
		tracerStr string
		url string
		method string
	)

	/* Should only return one row, so this becomes a one-liner. */
	rows, err := stmt.Query(traver_string)
	if err != nil {
		return tracer.Tracer{}, err
	}
	defer rows.Close()
	
	/* This loop should only happen once. */
	for rows.Next() {
		rows.Scan(&id, &tracerStr, &url, &method)
	}

	/* Build a tracer struct from the data. */
	t := tracer.Tracer{
		ID: id,
		TracerString: tracerStr, 
		URL: url, 
		Method: method}

	/* Return the tracer and nil to indicate everything went okay. */
	return t, nil
}

/* Prepared statement for getting all the tracers. */
func GetTracers(db *sql.DB) ([]tracer.Tracer, error) {
	stmt, err := db.Prepare(`SELECT * FROM tracers;`)
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
	tracers := make([]tracer.Tracer, 0)
	for rows.Next() {
		var (
			id int
			tracerStr string
			url string
			method string
		)

		/* Scan the row. */
		err = rows.Scan(&id, &tracerStr, &url, &method)
		if err != nil {
			/* Fail fast if this messes up. */
			return nil, err
		}

		/* Build a tracer struct from the data. */
		tracer := tracer.Tracer{
			ID: id,
			TracerString: tracerStr, 
			URL: url, 
			Method: method}

		/* Add the tracer to the slice. */
		tracers = append(tracers, tracer)
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
	stmt, err := db.Prepare(`
	DELETE from tracers 
	WHERE tracer_string = ?;`)

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