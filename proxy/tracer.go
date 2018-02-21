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
	"tracy/api/types"
	"tracy/configure"
	"tracy/log"
)

/* Helper function for searching for tracer tags in query parameters and body and replacing them with randomly generated
 * tracer string. Also, it submits the generated tracers to the API. This should be moved out, though. */
func replaceTracers(req *http.Request) ([]types.Tracer, error) {
	/* Search the query string for any tags that need to be replaced with tracer strings and replace them. */
	rstring, ret := replaceTracerStrings([]byte(req.URL.RawQuery))
	/* Write the new query string to the request. */
	req.URL.RawQuery = string(rstring)
	req.RequestURI = string(rstring)

	/* Create tracer structs out of the generated tracer strings. */
	for i := 0; i < len(ret); i++ {
		ret[i].TracerLocationType = types.QueryParam
	}

	/* Read the HTTP request body. */
	requestData, err := ioutil.ReadAll(req.Body)
	if err == nil {
		defer req.Body.Close()

		/* Search the body for any tags that need to be replaced with tracer strings and replace them. */
		rstring, rtracers := replaceTracerStrings(requestData)
		for _, t := range rtracers {
			t.TracerLocationType = types.Body
			ret = append(ret, t)
		}

		/* Write the new body to the request. */
		req.Body = ioutil.NopCloser(bytes.NewReader(rstring))
		/* Update the size of the request based on the replaced body. */
		req.ContentLength = int64(len(rstring))
	}

	/* If an error dropped here, log it. */
	if err != nil {
		log.Error.Println(err)
	}

	return ret, err
}

/* Helper function to replace any tracer strings in the request
 * with tracer payloads. Returns the replaced body along with a list of
 * tracers used to replace the tracer strings. */
func replaceTracerStrings(data []byte) ([]byte, []types.Tracer) {
	var replacedTracers []types.Tracer
	var err error
	replacedBody := make([]byte, 0)

	labelsConfig, err := configure.ReadConfig("tracers")
	if err != nil {
		log.Error.Fatal(err.Error())
		return []byte{}, []types.Tracer{}
	}

	var labels [][]byte
	for s, _ := range labelsConfig.(map[string]interface{}) {
		labels = append(labels, []byte(s))
		labels = append(labels, []byte(url.QueryEscape(s)))
	}

	i := -1
	for {
		i++
		// Using this label to return from the inner loop a little bit nicer.
	start:
		if i >= len(data) {
			break
		}
		// Check that the length of the data is long enough to be able to compare to two bytes.
		// If it is, check to see if the first two bytes match the configured start value or the configured
		// start value URL encoded.
		for _, tracerString := range labels {
			if i+len(tracerString) <= len(data) && bytes.Compare(data[i:i+len(tracerString)], tracerString) == 0 {
				log.Trace.Printf("Found a tracer string: %s")
				// From here on, tracerString will hold the contents that we think is
				// a tracer string but really it could be anything that just starts with
				// whatever was configured by start-payload in the configuration file.
				var tracerPayload string
				var tracerBytes []byte
				tracerPayload, tracerBytes, err = TransformTracerString(tracerString)
				if err != nil {
					log.Error.Println("There must be something wrong with configuration file syncing properly.")
					goto notFound
				}

				replacedBody = append(replacedBody, tracerBytes...)

				// It is annoying for the UI to display URL encoded values. Convert them here.
				var uTracerString string
				uTracerString, err = url.QueryUnescape(string(tracerString))
				if err != nil {
					log.Error.Println(err)
					return []byte{}, []types.Tracer{}
				}

				tracer := types.Tracer{
					TracerString:        uTracerString,
					TracerPayload:       tracerPayload,
					TracerLocationIndex: uint(i) + 1,
				}
				replacedTracers = append(replacedTracers, tracer)

				/* Update the look to make sure that it is pointing at the next byte after the tracer string*/
				i += len(tracerString)
				// We finished this tracer string, we don't need to iterate the other ones.
				goto start
			}
		}
	notFound:
		//If no tracer string was found just append the byte
		replacedBody = append(replacedBody, data[i])
	}

	log.Trace.Printf("New Body Value: %s %d", string(replacedBody), len(replacedBody))

	return replacedBody, replacedTracers
}

/*TransformTracerString is a helper function that returns a random string that is used to track the tracer and the actual payload
 * as a slice of bytes. */
func TransformTracerString(tracerString []byte) (string, []byte, error) {
	idTag := "[[ID]]"
	unescapedTag, err := url.QueryUnescape(string(tracerString))

	if err == nil {
		labels, err := configure.ReadConfig("tracers")
		if err == nil {
			for tracer, payload := range labels.(map[string]interface{}) {
				if unescapedTag == tracer {
					randID := generateRandomTracerString()
					return string(randID), []byte(strings.Replace(payload.(string), idTag, string(randID), 1)), nil
				}
			}
		}
	}

	//No tag found
	return "", nil, fmt.Errorf("There were no tracers that matched: %s", string(tracerString))
}

/*FindTracersInResponseBody is a helper function for finding tracer strings in
 * the response body of an HTTP request. */
func findTracersInResponseBody(response string, url string, requests []types.Request) []types.Tracer {
	ret := make([]types.Tracer, 0)

	/* For each of the tracers, look for the tracer's tracer string in the response. */
	for _, request := range requests {
		for _, tracer := range request.Tracers {
			index := strings.Index(response, tracer.TracerPayload)

			/* Negative indicates no match. Continue. */
			if index > -1 {
				log.Trace.Printf("Found a tracer! %s", tracer.TracerPayload)
				//TODO: should we create multiple events if a tracer shows up multiple times in a response?
				event := types.TracerEvent{
					TracerID:  tracer.ID,
					RawEvent:  response,
					EventURL:  url,
					EventType: "response",
				}
				tracer.TracerEvents = make([]types.TracerEvent, 1)
				tracer.TracerEvents[0] = event

				ret = append(ret, tracer)
			}
		}
	}

	return ret
}

func init() {
	/* When the package is loaded, seed the random number generator. */
	rand.Seed(time.Now().UnixNano())
}

/* Helper function for generating random tracer strings. */
func generateRandomTracerString() []byte {
	return randStringBytes(10)
}

//Note: now it will only make strings with low case tags. This might be a problem if there is a lot of random text on the page .
const alphabet = "abcdefghijklmnopqrstuvwxyz"

/*RandStringBytes returns random string bytes based on size. */
func randStringBytes(n int) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = alphabet[rand.Intn(len(alphabet))]
	}
	return b
}
