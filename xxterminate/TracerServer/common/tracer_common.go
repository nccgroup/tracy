package common

import (
	"encoding/json"
	"fmt"
	"log"
	"xxterminator-plugin/xxterminate/TracerServer/store"
	"xxterminator-plugin/xxterminate/TracerServer/types"
)

/*AddTracer is the common functionality to add a tracer to the database. This function
 * has been separated so both HTTP and websocket servers can use it. */
func AddTracer(add types.Tracer) ([]byte, error) {
	var ret []byte
	var err error

	trcr, err := store.DBAddTracer(store.TracerDB, add)
	if err == nil {
		ret, err = json.Marshal(trcr)
	}

	/* Log message to record the tracer added and any errors that might have been triggered. */
	log.Printf("Adding a tracer event. Ret: %v; Err: %v", string(ret), err)

	return ret, err
}

/*DeleteTracer is the common functionality to delete a tracer to the database. This
 * function has been separated so both HTTP and websocket servers can use it. */
func DeleteTracer(trcrID int) ([]byte, error) {
	var ret []byte
	var err error = store.DBDeleteTracer(store.TracerDB, trcrID)

	if err == nil {
		ret = []byte(fmt.Sprintf(`{"id": "%d", "status": "deleted"}`, trcrID))
	}

	/* Log message to record the tracer deleted and any errors that might have been triggered. */
	log.Printf("Deleting a tracer event. Ret: %v; Err: %v", string(ret), err)

	return ret, err
}

/*EditTracer is the common functionality to edit a tracer. This function
 * has been separated so both HTTP and websocket servers can use it. */
func EditTracer(trcrID int, trcr types.Tracer) ([]byte, error) {
	var ret []byte
	var err error

	updated, err := store.DBEditTracer(store.TracerDB, trcrID, trcr)
	if err == nil {
		trcrStr, err := json.Marshal(updated)
		if err == nil {
			ret = trcrStr
		}
	}

	/* Log message to record the tracer edited and any errors that might have been triggered. */
	log.Printf("Editing a tracer event. Ret: %v; Err: %v", string(ret), err)

	return ret, err
}

/*GetTracer is the common functionality to get a tracer from the database. This function
 * has been separated so both HTTP and websocket servers can use it. */
func GetTracer(trcrID int) ([]byte, error) {
	var ret []byte
	var err error

	trcr, err := store.DBGetTracerByID(store.TracerDB, trcrID)
	if err == nil {
		trcrStr, err := json.Marshal(trcr)
		if err == nil {
			ret = trcrStr
		}
	}

	/* Log message to record the tracer added and any errors that might have been triggered. */
	log.Printf("Getting a tracer. Ret: %v; Err: %v", string(ret), err)

	return ret, err
}

/*GetTracers is the common functionality to get all the tracers from database.
 * This function has been separated so both HTTP and websocket servers can use it. */
func GetTracers() ([]byte, error) {
	var ret []byte
	var err error

	tracers, err := store.DBGetTracers(store.TracerDB)
	if err == nil {
		tracersStr, err := json.Marshal(tracers)
		if err == nil {
			ret = tracersStr
		}
	}

	/* Log message to record the tracer added and any errors that might have been triggered. */
	log.Printf("Getting all the tracers. Ret: %v; Err: %v", string(ret), err)

	return ret, err
}
