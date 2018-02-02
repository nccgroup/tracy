package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"tracy/configure"
	"tracy/log"
	"tracy/tracer/types"
)

/*AddTracers takes multiple tracer structs and sends them to the tracer API. This client request can return multiple errors,
 * up to one per tracer sent. */
func AddTracers(request types.Request) []error {
	ret := make([]error, 0)

	log.Trace.Printf("Adding the following tracers: %+v", request.Tracers)
	requestJSON, err := json.Marshal(request)
	if err != nil {
		log.Warning.Printf(err.Error())
	} else {
		log.Trace.Printf("Decoded the tracer into the following JSON: %s", requestJSON)

		/* Send the request off to the API. We don't need the response.*/
		var tracerServer interface{}
		tracerServer, err = configure.ReadConfig("tracer-server")
		if err != nil {
			log.Warning.Printf(err.Error())
		} else {
			url := fmt.Sprintf("http://%s/tracers", tracerServer.(string))
			contentType := "application/json; charset=UTF-8"
			log.Trace.Printf("Sending POST request to %s %s", url, contentType)
			_, err = http.Post(url, contentType, bytes.NewBuffer(requestJSON))

			/* If there was a server error, move to the next tracer. */
			if err != nil {
				log.Warning.Printf(err.Error())
			} else {
				log.Trace.Printf("Request submitted successfully")
			}
		}
	}

	return err
}

/*GetTracers gets a list of the current tracers in the database. */
func GetTracers() ([]types.Tracer, error) {
	log.Trace.Printf("Getting all the tracers")
	ret := make([]types.Tracer, 0)

	/* Make the GET request. */
	tracerServer, err := configure.ReadConfig("tracer-server")
	if err == nil {
		url := fmt.Sprintf("http://%s/tracers", tracerServer.(string))
		log.Trace.Printf("Sending GET request to %s", url)
		tracers, err := http.Get(url)
		if err == nil {
			log.Trace.Printf("Request submitted successfully")
			tracersBody, err := ioutil.ReadAll(tracers.Body)
			if err == nil {
				log.Trace.Printf("Read the following from the request response: %s", tracersBody)
				/* Last success case. Unmarshal the tracers and check for parsing errors. */
				err = json.Unmarshal(tracersBody, &ret)
			}
			defer tracers.Body.Close()
		}
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*AddTracerEvents takes multiple tracer event structs and adds to them to a tracer using the tracer API. This client
 * request can return multiple errors, up to one per tracer sent. */
func AddTracerEvents(tracerEvents map[int]types.TracerEvent) []error {
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
func AddTracerEvent(tracerEvent types.TracerEvent, tracerID int) error {
	log.Trace.Printf("Adding the following tracer event: %+v, tracer ID: %s", tracerEvent, tracerID)

	eventData, err := json.Marshal(tracerEvent)
	if err == nil {
		var tracerServer interface{}
		tracerServer, err = configure.ReadConfig("tracer-server")
		if err == nil {
			url := fmt.Sprintf("http://%s/tracers/%d/events", tracerServer.(string), tracerID)
			contentType := "application/json; charset=UTF-8"
			log.Trace.Printf("Sending POST request with %s to %s %s", eventData, url, contentType)
			_, err = http.Post(url, contentType, bytes.NewBuffer(eventData))
		}
	}

	/* If an error dropped here, record it. */
	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return err
}

/*AddLabel adds a single label to the tracer API. */
func AddLabel(label types.Label) error {
	log.Trace.Printf("Adding the following label: %+v", label)
	var ret error

	labelJSON, err := json.Marshal(label)
	if err == nil {
		var tracerServer interface{}
		tracerServer, err = configure.ReadConfig("tracer-server")
		if err == nil {
			url := fmt.Sprintf("http://%s/labels", tracerServer.(string))
			contentType := "application/json; charset=UTF-8"
			log.Trace.Printf("Sending POST request with %s to %s %s", labelJSON, url, contentType)
			_, err = http.Post(url, contentType, bytes.NewBuffer(labelJSON))
		}
	}

	/* If an error dropped here, record it. */
	if err != nil {
		log.Warning.Printf(err.Error())
		ret = err
	}

	return ret
}

/*GetLabels gets a list of the all the labels in the database. */
func GetLabels() ([]types.Label, error) {
	log.Trace.Printf("Getting all the labels")
	ret := make([]types.Label, 0)

	/* Make the GET request. */
	tracerServer, err := configure.ReadConfig("tracer-server")
	if err == nil {
		url := fmt.Sprintf("http://%s/labels", tracerServer.(string))
		log.Trace.Printf("Sending GET request to %s", url)
		labels, err := http.Get(url)
		if err == nil {
			log.Trace.Printf("Request submitted successfully")
			tracersBody, err := ioutil.ReadAll(labels.Body)
			if err == nil {
				log.Trace.Printf("Read the following from the request response: %s", tracersBody)
				/* Last success case. Unmarshal the tracers and check for parsing errors. */
				err = json.Unmarshal(tracersBody, &ret)
			}
			defer labels.Body.Close()
		}
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*GetLabel gets the label with the ID in the API. */
func GetLabel(ID int) (types.Label, error) {
	log.Trace.Printf("Getting the label %d", ID)
	ret := types.Label{}

	/* Make the GET request. */
	tracerServer, err := configure.ReadConfig("tracer-server")
	if err == nil {
		url := fmt.Sprintf("http://%s/tracers/%d", tracerServer.(string), ID)
		log.Trace.Printf("Sending GET request to %s", url)
		label, err := http.Get(url)
		if err == nil {
			log.Trace.Printf("Request submitted successfully")
			labelBody, err := ioutil.ReadAll(label.Body)
			if err == nil {
				log.Trace.Printf("Read the following from the request response: %s", labelBody)
				/* Last success case. Unmarshal the label and check for parsing errors. */
				err = json.Unmarshal(labelBody, &ret)
			}
			defer label.Body.Close()
		}
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}
