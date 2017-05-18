package store

import (
	"database/sql"
	/* Chosing this library because it implements the golang stdlin database
	 * sql interface. */
	_ "github.com/mattn/go-sqlite3"
	"log"
	"main"
	"fmt"
)

/* Open the database. Errors indicate something incorrectly happened while
 * connecting. Don't forget to close this DB when finished using it. */
func Open(driver, access string) (*sql.DB, error) {
	/* Open the database. */
	db, err := sql.Open(driver, access)

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

	/* Return the database and nil, indicating we made a sound connection. */
	return db, nil
}

/* Prepared statement for adding a tracer. */
func AddTracer(db *sql.DB, tracerString string, t main.Tracer) err {
	/* Using prepared statements. */
	stmt, err := db.Prepare(`
	INSERT INTO tracers 
		(tracerString, url, method)
	VALUES
		(?, ?, ?);`)

	if err != nil {
		return err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(t.ID, t.URL, t.Method)
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
func GetTracer(db *sql.DB, tracerString string) (main.Tracer, err) {
	stmt, err := db.Prepare(`
	SELECT * FROM tracers 
	WHERE tracerString = ?;`)
	if err != nil {
		return nil, err
	}

	/* Query the database for the tracer. */
	var (
		id int
		tracerStr string
		url string
		method string
		eventRef int
	)

	/* Should only return one row, so this becomes a one-liner. */
	err = stmt
		.Query(tracerString)
		.Scan(&id, &tracerStr, &url, &method, &eventRef)
	if err != nil {
		return nil, err
	}

	/* Build a tracer struct from the data. */
	tracer := main.Tracer{
		ID: tracerStr, 
		URL: url, 
		Method: method}

	/* Return the tracer and nil to indicate everything went okay. */
	return tracer, nil
}

/* Prepared statement for getting all the tracers. */
func GetTracers() (db *sql.DB, main.Tracer[], err) {
	stmt, err := db.Prepare(`
	SELECT * FROM tracers;`)
	if err != nil {
		return nil, err
	}

	/* Query the database for the tracer. */
	rows, err = stmt.Query(tracerString)
	if err != nil {
		return nil, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why I can't get the number of rows from a Rows type. Kind of annoying. */
	tracers := make([]main.Tracers, 0)
	for rows.Next() {
		var (
			id int
			tracerStr string
			url string
			method string
			eventRef int
		)

		/* Scan the row. */
		err = rows.Scan(&id, &tracerStr, &url, &method, &eventRef)
		if err != nil {
			/* Fail fast if this messes up. */
			return nil, err
		}

		/* Build a tracer struct from the data. */
		tracer := main.Tracer{
			ID: tracerStr, 
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
func DeleteTracer(db *sql.DB, tracerString string) err {
/* Using prepared statements. */
	stmt, err := db.Prepare(`
	DELETE from tracers 
	WHERE tracerString = ?;`)

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