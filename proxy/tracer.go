package proxy

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"math/rand"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
)

// replaceTracers searches for tracer strings in HTTP query parameters and bodies
// and replaces them with randomly generated tracer payloads. Also, it submits
// the generated tracers to the API.
func replaceTracers(req *http.Request) ([]types.Tracer, error) {
	// Search the query string for any tags that need to be replaced with
	// tracer strings and replace them.
	rstring, tracers := replaceTracerStrings([]byte(req.URL.RawQuery))

	// Write the new query string to the request.
	req.URL.RawQuery = string(rstring)
	req.RequestURI = req.URL.Path + "?" + string(rstring)

	// Create tracer structs out of the generated tracer strings.
	for i := range tracers {
		tracers[i].TracerLocationType = types.QueryParam
	}

	// Read the HTTP request body.
	requestData, err := ioutil.ReadAll(req.Body)

	if err != nil {
		return tracers, err
	}

	defer req.Body.Close()

	// Search the body for any tags that need to be replaced with tracer
	// strings and replace them.
	rstring, rtracers := replaceTracerStrings(requestData)
	for _, t := range rtracers {
		t.TracerLocationType = types.Body
		tracers = append(tracers, t)
	}

	// Write the new body to the request.
	req.Body = ioutil.NopCloser(bytes.NewReader(rstring))
	// Update the size of the request based on the replaced body.
	req.ContentLength = int64(len(rstring))
	return tracers, err

}

// replaceTracerStrings replaces any tracer strings in a slice of bytes
// with tracer payloads. Returns the replaced slicey along with a list of
// tracers used to replace the tracer strings. */
func replaceTracerStrings(data []byte) ([]byte, []types.Tracer) {
	var replacedTracers []types.Tracer

	labelsConfig := configure.Current.TracerStrings

	var labels [][]byte
	for s := range labelsConfig {
		labels = append(labels, []byte(s), []byte(url.QueryEscape(s)))
	}

	for _, tracerString := range labels {
		index := bytes.Index(data, tracerString)
		for index != -1 {
			tracerPayload, tracerBytes, err := TransformTracerString(tracerString)
			if err != nil {
				log.Error.Println("There must be something wrong with configuration file syncing properly.")
				break
			}
			// modify data so that we don't need to make a copy of it
			data = bytes.Replace(data, tracerString, tracerBytes, 1)
			// It is annoying for the UI to display URL encoded values. Convert them here.
			uTracerString, err := url.QueryUnescape(string(tracerString))
			if err != nil {
				log.Error.Println(err)
				return []byte{}, []types.Tracer{}
			}
			tracer := types.Tracer{
				TracerString:        uTracerString,
				TracerPayload:       tracerPayload,
				TracerLocationIndex: uint(index),
			}
			replacedTracers = append(replacedTracers, tracer)
			index = bytes.Index(data, tracerString)
		}
	}
	return data, replacedTracers
}

// TransformTracerString returns a random string that is used to track the
// tracer and the actual payload as a slice of bytes.
func TransformTracerString(tracerString []byte) (string, []byte, error) {
	idTag := "[[ID]]"
	unescapedTag, err := url.QueryUnescape(string(tracerString))
	if err != nil {
		return "", nil, fmt.Errorf("Could not QueryUnescape: %s, Error: %s", string(tracerString), err)
	}
	labels := configure.Current.TracerStrings
	for tracer, payload := range labels {
		if unescapedTag == tracer {
			randID := generateRandomTracerString()
			return string(randID), []byte(strings.Replace(payload, idTag, string(randID), 1)), nil
		}
	}

	//No tag found
	return "", nil, fmt.Errorf("There were no tracers that matched: %s", string(tracerString))
}

// FindTracersInResponseBody finds tracer strings in the response body of an HTTP request.
func findTracersInResponseBody(response string, url string, requests []types.Request) []types.Tracer {
	tracers := make([]types.Tracer, 0)

	// For each of the tracers, look for the tracer's tracer string in the response.
	for _, request := range requests {
		for _, tracer := range request.Tracers {
			if strings.Contains(response, tracer.TracerPayload) {
				log.Trace.Printf("Found a tracer! %s", tracer.TracerPayload)
				//TODO: should we create multiple events if a tracer shows up multiple times in a response?
				tracer.TracerEvents = []types.TracerEvent{types.TracerEvent{
					TracerID:  tracer.ID,
					EventURL:  url,
					EventType: "response",
				}}
				tracers = append(tracers, tracer)
			}
		}
	}
	return tracers
}

func init() {
	// When the package is loaded, seed the random number generator.
	rand.Seed(time.Now().UnixNano())
}

// generateRandomTracerString generats random tracer strings.
func generateRandomTracerString() []byte {
	return randStringBytes(10)
}

// Note: now it will only make strings with low case tags. This might be a problem
// if there is a lot of random text on the page .
const alphabet = "abcdefghijklmnopqrstuvwxyz"

// randStringBytes returns random string bytes based on size.
func randStringBytes(n int) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = alphabet[rand.Intn(len(alphabet))]
	}
	return b
}
