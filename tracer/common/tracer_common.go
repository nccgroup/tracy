package common

import (
	"encoding/json"
	"fmt"
	"xxterminator-plugin/log"
	"xxterminator-plugin/tracer/store"
	"xxterminator-plugin/tracer/types"
)

/*AddTracer is the common functionality to add a tracer to the database. This function
 * has been separated so both HTTP and websocket servers can use it. */
func AddTracer(trcr types.Tracer) ([]byte, error) {
	/* Log message to record the tracer added and any errors that might have been triggered. */
	log.Trace.Printf("Adding a tracer to the database: %+v", trcr)
	var ret []byte
	var err error

	trcrAdded, err := store.DBAddTracer(store.TracerDB, trcr)
	if err == nil {
		log.Trace.Printf("Successfully added the tracer to the database.")
		ret, err = json.Marshal(trcrAdded)
	}

	/* If any errors have dropped here, catch and record them. */
	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*DeleteTracer is the common functionality to delete a tracer to the database. This
 * function has been separated so both HTTP and websocket servers can use it. */
func DeleteTracer(trcrID int) ([]byte, error) {
	log.Trace.Printf("Deleting a tracer from the database: %d", trcrID)
	var ret []byte
	var err error = store.DBDeleteTracer(store.TracerDB, trcrID)

	if err == nil {
		log.Trace.Printf("Successfully deleted the tracer from the database.")
		ret = []byte(fmt.Sprintf(`{"id": "%d", "status": "deleted"}`, trcrID))
	} else {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*EditTracer is the common functionality to edit a tracer. This function
 * has been separated so both HTTP and websocket servers can use it. */
func EditTracer(trcrID int, trcr types.Tracer) ([]byte, error) {
	log.Trace.Printf("Editing the following tracer: %+v, tracerID: %d", trcr, trcrID)
	var ret []byte
	var err error

	updated, err := store.DBEditTracer(store.TracerDB, trcrID, trcr)
	if err == nil {
		log.Trace.Printf("Successfully edited the tracer")
		trcrStr, err := json.Marshal(updated)
		if err == nil {
			ret = trcrStr
		}
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*GetTracer is the common functionality to get a tracer from the database. This function
 * has been separated so both HTTP and websocket servers can use it. */
func GetTracer(trcrID int) ([]byte, error) {
	log.Trace.Printf("Getting the following tracer:%d", trcrID)
	var ret []byte
	var err error

	trcr, err := store.DBGetTracerWithEventsByID(store.TracerDB, trcrID)
	if err == nil {
		log.Trace.Printf("Successfully got the following tracer: %+v", trcr)
		trcrStr, err := json.Marshal(trcr)
		if err == nil {
			ret = trcrStr
		}
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*GetTracers is the common functionality to get all the tracers from database.
 * This function has been separated so both HTTP and websocket servers can use it. */
func GetTracers() ([]byte, error) {
	log.Trace.Printf("Getting all the tracers.")
	var ret []byte
	var err error

	tracers, err := store.DBGetTracers(store.TracerDB)
	if err == nil {
		log.Trace.Printf("Successfully got the tracers: %+v", tracers)
		tracersStr, err := json.Marshal(tracers)
		if err == nil {
			ret = tracersStr
		}
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*GetTracersWithEvents is the common functionality to get all the tracers from database with their associated events.
 * This function has been separated so both HTTP and websocket servers can use it. */
func GetTracersWithEvents() ([]byte, error) {
	log.Trace.Printf("Getting all the tracers with their events.")
	var ret []byte
	var err error

	tracers, err := store.DBGetTracersWithEvents(store.TracerDB)
	if err == nil {
		log.Trace.Printf("Successfully got the tracers with their corresponding events: %+v", tracers)
		tracersStr, err := json.Marshal(tracers)
		if err == nil {
			ret = tracersStr
		}
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}
