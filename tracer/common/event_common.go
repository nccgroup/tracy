package common

import (
	"encoding/json"
	"fmt"
	"xxterminator-plugin/log"
	"xxterminator-plugin/tracer/store"
	"xxterminator-plugin/tracer/types"
)

/*AddEvent is the common functionality to add an event to the database. This function
 * has been separated so both HTTP and websocket servers can use it. */
func AddEvent(trcrID int, trcrEvnt types.TracerEvent) ([]byte, error) {
	log.Trace.Printf("Adding the following tracer event: %+v, tracerID: %d", trcrEvnt, trcrID)
	var ret []byte
	var err error

	/* Look up the tracer based on the provided ID. */
	trcr, err := store.DBGetTracerWithEventsByID(store.TracerDB, trcrID)
	if err == nil {
		/* Make sure the ID of the tracer exists. */
		if trcr.ID == 0 {
			err = fmt.Errorf("The tracer ID %d doesn't exist: %+v", trcrID, trcr)
		} else {
			log.Trace.Printf("Found the tracer in the database: %+v.", trcr)
			/* If it is a valid tracer event and the tracer exists, then add it to the database. */
			event, err := store.DBAddTracerEvent(store.TracerDB, trcrEvnt, []string{trcr.TracerString})
			if err == nil {
				log.Trace.Printf("Successfully added the tracer event to the database: %+v", event)
				ret, err = json.Marshal(event)
			}
		}
	}

	/* Catch any errors that have dropped here. */
	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}
