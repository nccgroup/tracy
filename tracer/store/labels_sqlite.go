package store

import (
	"database/sql"
	"fmt"
	_ "github.com/mattn/go-sqlite3"
	"tracy/log"
	"tracy/tracer/types"
)

/*DBAddLabel adds a label to the labels table. */
func DBAddLabel(db *sql.DB, l types.Label) (types.Label, error) {
	/* Using prepared statements. */
	query := fmt.Sprintf(`
	INSERT INTO %s 
		(%s, %s)
	VALUES
		(?, ?);`,
		LabelsTable,
		LabelsTracerColumn, LabelsTracerPayloadColumn)
	log.Trace.Printf("Built this query for adding a tracer event: %s", query)
	stmt, err := db.Prepare(query)

	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Label{}, err
	}
	/* Don't forget to close the prepared statement when this function is completed. */
	defer stmt.Close()

	/* Execute the query. */
	res, err := stmt.Exec(l.Tracer, l.TracerPayload)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Label{}, err
	}

	/* Check the response. */
	lastID, err := res.LastInsertId()
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Label{}, err
	}

	/* Make sure one row was inserted. */
	rowCnt, err := res.RowsAffected()
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Label{}, err
	}
	log.Trace.Printf("AddTracerEvent: ID = %d, affected = %d", lastID, rowCnt)

	label, err := DBGetLabelByID(db, int(lastID))
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Label{}, err
	}

	/* Otherwise, return nil to indicate everything went okay. */
	return label, nil
}

/*DBGetLabelByID gets a label by the label ID. */
func DBGetLabelByID(db *sql.DB, id int) (types.Label, error) {
	query := fmt.Sprintf(
		`SELECT %s.%s, %s.%s, %s.%s
		 FROM %s
		 WHERE %s.%s = ?;`,
		LabelsTable, LabelsIDColumn,
		LabelsTable, LabelsTracerColumn,
		LabelsTable, LabelsTracerPayloadColumn,
		LabelsTable,
		LabelsTable, LabelsIDColumn)

	log.Trace.Printf("Built this query for getting a tracer: %s, id: %d", query, id)
	stmt, err := db.Prepare(query)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Label{}, err
	}
	defer stmt.Close()

	/* Query the database for the types. */
	rows, err := stmt.Query(id)
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Label{}, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why we need to check for errors again, but this was from the
	 * Golang examples. Checking for errors during iteration.*/
	err = rows.Err()
	if err != nil {
		log.Warning.Printf(err.Error())
		return types.Label{}, err
	}

	ret := types.Label{}
	for rows.Next() {
		var (
			labelID            types.JSONNullInt64
			labelTracer        types.JSONNullString
			labelTracerPayload types.JSONNullString
		)

		err := rows.Scan(&labelID, &labelTracer, &labelTracerPayload)
		if err != nil {
			log.Warning.Printf(err.Error())
			/* Fail fast if this messes up. */
			return types.Label{}, err
		}

		ret = types.Label{
			ID:            labelID,
			Tracer:        labelTracer,
			TracerPayload: labelTracerPayload,
		}
	}

	/* Validate we have a label. */
	if ret.ID.Int64 != int64(id) {
		log.Warning.Printf("No label with ID %d", id)
		return types.Label{}, nil
	}

	/* Return the label and nil to indicate everything went okay. */
	return ret, nil
}

/*DBGetLabels gets all the labels. */
func DBGetLabels(db *sql.DB) ([]types.Label, error) {
	query := fmt.Sprintf(
		`SELECT %s.%s, %s.%s, %s.%s
		 FROM %s;`,
		LabelsTable, LabelsIDColumn,
		LabelsTable, LabelsTracerColumn,
		LabelsTable, LabelsTracerPayloadColumn,
		LabelsTable)

	log.Trace.Printf("Built this query for getting a label: %s", query)
	stmt, err := db.Prepare(query)
	if err != nil {
		log.Warning.Printf(err.Error())
		return nil, err
	}
	defer stmt.Close()

	/* Query the database for the types. */
	rows, err := stmt.Query()
	if err != nil {
		log.Warning.Printf(err.Error())
		return nil, err
	}
	/* Make sure to close the database connection. */
	defer rows.Close()

	/* Not sure why we need to check for errors again, but this was from the
	 * Golang examples. Checking for errors during iteration.*/
	err = rows.Err()
	if err != nil {
		log.Warning.Printf(err.Error())
		return nil, err
	}

	ret := make([]types.Label, 0)
	for rows.Next() {
		var (
			labelID            types.JSONNullInt64
			labelTracer        types.JSONNullString
			labelTracerPayload types.JSONNullString
		)

		err := rows.Scan(&labelID, &labelTracer, &labelTracerPayload)
		if err != nil {
			log.Warning.Printf(err.Error())
			/* Fail fast if this messes up. */
			return nil, err
		}

		l := types.Label{
			ID:            labelID,
			Tracer:        labelTracer,
			TracerPayload: labelTracerPayload,
		}

		ret = append(ret, l)
	}

	/* Return the label and nil to indicate everything went okay. */
	return ret, nil
}
