package client

import (
	"encoding/json"
	"net/http"
	"bytes"
	"xxterminator-plugin/log"
	"xxterminator-plugin/tracer/types"
	"fmt"
	"xxterminator-plugin/tracer/configure"
	"io/ioutil"
)

/*AddTracers takes multiple tracer structs and sends them to the tracer API. This client request can return multiple errors,
 * up to one per tracer sent. */
func AddTracers(tracers []types.Tracer) []error {
	ret := make([]error, 0)

	log.Trace.Println("Adding the following tracers: %+v", tracers)
	/* For each of the tracers, marshal it and send it off to the API. */
	for _, tracer := range tracers {
		err := AddTracer(tracer)
		if err != nil {
			ret = append(ret, err)
		}
	}

	return ret
}

/*AddTracer adds one tracer to the tracer API. */
func AddTracer(tracer types.Tracer) error {
	var ret error

	tracerJSON, err := json.Marshal(tracer)
	log.Trace.Println("Tracer JSON: %s", string(tracerJSON))
	if err != nil {
		/* If one of the tracer's is messed up and leave. */
		ret = err
	} else {
		/* Send the request off to the API. */
		_, err := http.Post(fmt.Sprintf("http://%s/tracers", configure.TracerServer),
			"application/json; charset=UTF-8",
			bytes.NewBuffer(tracerJSON))
		/* If there was a server error, move to the next tracer. */
		if err != nil {
			ret = err
		}
	}

	return ret
}


/*GetTracers gets a list of the current tracers in the database. */
func GetTracers() (map[string]types.Tracer, error) {
	ret := make(map[string]types.Tracer, 0)

	/* Make the GET request. */
	tracers, err := http.Get(fmt.Sprintf("http://%s/tracers",configure.TracerServer))
	if err == nil {
		tracersBody, err := ioutil.ReadAll(tracers.Body)
		if err == nil {
			/* Last success case. Unmarshal the tracers and check for parsing errors. */
			err = json.Unmarshal(tracersBody, &ret)
		}
		defer tracers.Body.Close()
	}
	log.Trace.Println("Tracers: %+v", ret)

	return ret, err
}

/*AddTracerEvents takes multiple tracer event structs and adds to them to a tracer using the tracer API. This client
 * request can return multiple errors, up to one per tracer sent. */
func AddTracerEvents(tracerEvents map[string]types.TracerEvent) []error {
	ret := make([]error, 0)

	log.Trace.Printf("Adding tracer events: %+v", tracerEvents)
	for tracerID, tracerEvent := range tracerEvents {
		/* Using the tracer ID associated with the event, add it to the API. */
		err := AddTracerEvent(tracerEvent, tracerID)
		if err != nil {
			/* If there is an error, record it and continue. */
			ret = append(ret, err)
		}

	}

	return ret
}

/*AddTracerEvent adds a single tracer event struct to a tracer using the tracer API. */
func AddTracerEvent(tracerEvent types.TracerEvent, tracerID string) error {
	var ret error

	eventData, err := json.Marshal(tracerEvent)
	if err == nil {
		_, err = http.Post(fmt.Sprintf("http://%s/tracers/%d/events", configure.TracerServer, tracerID),
			"application/json; charset=UTF-8",
			bytes.NewBuffer(eventData))
	}

	/* If an error dropped here, record it. */
	if err != nil {
		ret = err
	}

	return ret
}