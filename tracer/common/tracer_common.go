package common

import (
	"encoding/json"
	"tracy/log"
	"tracy/tracer/store"
	"tracy/tracer/types"
)

/*AddTracer is the common functionality to add a tracer to the database. This function
 * has been separated so both HTTP and websocket servers can use it. */
func AddTracer(request types.Request) ([]byte, error) {
	/* Log message to record the tracer added and any errors that might have been triggered. */
	log.Trace.Printf("Adding a tracer to the database: %+v", request)
	var ret []byte
	var err error

	if err = store.DB.Create(&request).Error; err == nil {
		log.Trace.Printf("Successfully added the tracer to the database.")
		ret, err = json.Marshal(request)
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*GetTracer is the common functionality to get a tracer from the database. This function
 * has been separated so both HTTP and websocket servers can use it. */
func GetTracer(tracerID uint) ([]byte, error) {
	log.Trace.Printf("Getting the following tracer:%d", tracerID)
	var ret []byte
	var err error

	var tracer types.Tracer
	if err = store.DB.First(&tracer, tracerID).Error; err == nil {
		log.Trace.Printf("Successfully got the following tracer: %+v", tracer)
		ret, err = json.Marshal(tracer)
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

	var tracers []types.Tracer
	if err = store.DB.Find(&tracers).Error; err == nil {
		log.Trace.Printf("Successfully got the tracers: %+v", tracers)
		ret, err = json.Marshal(tracers)
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*GetTracerRequest gets the raw request for the trace that was just selected. */
func GetTracerRequest(tracerID uint) ([]byte, error) {
	log.Trace.Printf("Getting request for the given tracer ID.")
	var ret []byte
	var err error

	var request types.Request
	if err = store.DB.First(&request).Error; err == nil {
		log.Trace.Printf("Successfully got the request: %+v", request)
		ret, err = json.Marshal(request)
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}
