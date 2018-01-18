package store

import (
	"database/sql"
	"fmt"
	/* Chosing this library because it implements the golang stdlin database
	 * sql interface. */
	_ "github.com/mattn/go-sqlite3"
	"tracy/log"
	"tracy/tracer/types"
)

/*DBAddEventContext adds a new event context. */
func DBAddEventContext(db *sql.DB, t types.EventsContext, eID types.JSONNullInt64) error {
	/* Using prepared statements. */
	stmt, err := db.Prepare(fmt.Sprintf(`
	INSERT INTO %s 
		(%s, %s, %s, %s)
	VALUES
		(?, ?, ?, ?);`,
		EventsContextTable,
		EventsContextDataColumn,
		EventsContextLocationTypeColumn, EventsContextNodeNameColumn,
		EventsContextEventID))

	if err != nil {
		log.Warning.Printf(err.Error())
		return err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(t.Context, t.LocationType, t.NodeName, eID)
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
	log.Trace.Printf("AddEventContext: ID = %d, affected = %d\n", lastID, rowCnt)

	/* Return nil to indicate no problems. */
	return nil
}
