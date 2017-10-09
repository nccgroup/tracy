package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"xxterminator-plugin/log"
	"xxterminator-plugin/tracer/configure"
	"xxterminator-plugin/tracer/types"
)

/*AddTracers takes multiple tracer structs and sends them to the tracer API. This client request can return multiple errors,
 * up to one per tracer sent. */
func AddTracers(tracers []types.Tracer) []error {
	ret := make([]error, 0)

	log.Trace.Printf("Adding the following tracers: %+v", tracers)
	/* For each of the tracers, marshal it and send it off to the API. */
	for _, tracer := range tracers {
		err := AddTracer(tracer)
		if err != nil {
			log.Warning.Printf(err.Error())
			ret = append(ret, err)
		}
	}

	return ret
}

/*AddTracer adds one tracer to the tracer API. */
func AddTracer(tracer types.Tracer) error {
	log.Trace.Printf("Adding the following tracer: %+v", tracer)
	var ret error
	tracerJSON, err := json.Marshal(tracer)
	if err != nil {
		log.Warning.Printf(err.Error())
		/* If one of the tracer's is messed up and leave. */
		ret = err
	} else {
		log.Trace.Printf("Decoded the tracer into the following JSON: %s", tracerJSON)

		/* Send the request off to the API. We don't need the response.*/
		url := fmt.Sprintf("http://%s/tracers", configure.TracerServer)
		contentType := "application/json; charset=UTF-8"
		log.Trace.Printf("Sending POST request to %s %s", url, contentType)
		_, err := http.Post(url, contentType, bytes.NewBuffer(tracerJSON))

		/* If there was a server error, move to the next tracer. */
		if err != nil {
			log.Warning.Printf(err.Error())
			ret = err
		} else {
			log.Trace.Printf("Request submitted successsfully")
		}
	}

	return ret
}

/*GetTracers gets a list of the current tracers in the database. */
func GetTracers() (map[string]types.Tracer, error) {
	log.Trace.Printf("Getting all the tracers")
	ret := make(map[string]types.Tracer, 0)

	/* Make the GET request. */
	url := fmt.Sprintf("http://%s/tracers", configure.TracerServer)
	log.Trace.Printf("Sending GET request to %s", url)
	tracers, err := http.Get(url)
	if err == nil {
		log.Trace.Printf("Request submitted successsfully")
		tracersBody, err := ioutil.ReadAll(tracers.Body)
		if err == nil {
			log.Trace.Printf("Read the following from the request response: %s", tracersBody)
			/* Last success case. Unmarshal the tracers and check for parsing errors. */
			err = json.Unmarshal(tracersBody, &ret)
		}
		defer tracers.Body.Close()
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*AddTracerEvents takes multiple tracer event structs and adds to them to a tracer using the tracer API. This client
 * request can return multiple errors, up to one per tracer sent. */
func AddTracerEvents(tracerEvents map[string]types.TracerEvent) []error {
	log.Trace.Printf("Adding the following tracer events: %+v", tracerEvents)
	ret := make([]error, 0)

	for tracerID, tracerEvent := range tracerEvents {
		/* Using the tracer ID associated with the event, add it to the API. */
		err := AddTracerEvent(tracerEvent, tracerID)
		if err != nil {
			/* If there is an error, record it and continue. */
			log.Warning.Printf(err.Error())
			ret = append(ret, err)
		}

	}

	return ret
}

/*AddTracerEvent adds a single tracer event struct to a tracer using the tracer API. */
func AddTracerEvent(tracerEvent types.TracerEvent, tracerID string) error {
	log.Trace.Printf("Adding the following tracer event: %+v, tracer ID: %s", tracerEvent, tracerID)
	var ret error

	eventData, err := json.Marshal(tracerEvent)
	if err == nil {
		url := fmt.Sprintf("http://%s/tracers/%d/events", configure.TracerServer, tracerID)
		contentType := "application/json; charset=UTF-8"
		log.Trace.Printf("Sending POST request with %s to %s %s", eventData, url, contentType)
		_, err = http.Post(url, contentType, bytes.NewBuffer(eventData))
	}

	/* If an error dropped here, record it. */
	if err != nil {
		log.Warning.Printf(err.Error())
		ret = err
	}

	return ret
}
