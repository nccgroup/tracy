package common

import (
	"encoding/json"
	"fmt"
	"log"
	"xxterminator-plugin/tracer/store"
	"xxterminator-plugin/tracer/types"
)

/*AddEvent is the common functionality to add an event to the database. This function
 * has been separated so both HTTP and websocket servers can use it. */
func AddEvent(trcrID int, trcrEvnt types.TracerEvent) ([]byte, error) {
	var ret []byte
	var err error

	/* Look up the tracer based on the provided ID. */
	trcr, err := store.DBGetTracerByID(store.TracerDB, trcrID)
	if err == nil {
		/* Make sure the ID of the tracer exists. */
		if trcr.ID == 0 {
			err = fmt.Errorf("The tracer ID %d doesn't exist", trcrID)
		} else {
			/* If it is a valid tracer event and the tracer exists, then add it to the database. */
			event, err := store.DBAddTracerEvent(store.TracerDB, trcrEvnt, []string{trcr.TracerString})
			if err == nil {
				ret, err = json.Marshal(event)
			}
		}
	}
	/* Log message to record the tracer added and any errors that might have been triggered. */
	log.Printf("Adding a tracer event. Ret: %v; Err: %v", string(ret), err)

	return ret, err
}
