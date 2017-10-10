package proxy

import (
	"bytes"
	"io/ioutil"
	"math/rand"
	"net/http"
	"strings"
	"time"
	"xxterminator-plugin/log"
	"xxterminator-plugin/tracer/types"
)

/*tag is a slice of strings that represent the character sequencies in requests that need to be replaced with random tracer strings. */
var tags = []string{"{{XSS}}", "%7B%7BXSS%7D%7D"}

const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

/* Helper function for searching for tracer tags in query parameters and body and replacing them with randomly generated
 * tracer string. Also, it submits the generated tracers to the API. This should be moved out, though. */
func replaceTracers(req *http.Request) ([]types.Tracer, error) {
	/* Search the query string for any tags that need to be replaced with tracer strings and replace them. */
	replacedQueryString, replacedTracerStrings := replaceTagsInQueryParameters(req.URL.RawQuery)
	/* Write the new query string to the request. */
	req.URL.RawQuery = replacedQueryString
	var ret []types.Tracer

	/* Read the HTTP request body. */
	requestData, err := ioutil.ReadAll(req.Body)
	if err == nil {
		defer req.Body.Close()

		/* Search the body for any tags that need to be replaced with tracer strings and replace them. */
		replacedBody, replacedTracerStringsInBody := replaceTagsInBody(requestData)

		/* Combine the two slices of new tracer strings. */
		replacedTracerStrings = append(replacedTracerStrings, replacedTracerStringsInBody...)
		/* Create tracer structs out of the generated tracer strings. */
		addedTracers := make([]types.Tracer, len(replacedTracerStrings))
		for i := 0; i < len(replacedTracerStrings); i++ {
			addedTracers[i] = types.Tracer{TracerString: replacedTracerStrings[i], URL: types.StringToJSONNullString(req.URL.String()), Method: types.StringToJSONNullString(req.Method)}
		}

		/* Write the new body to the request. */
		req.Body = ioutil.NopCloser(bytes.NewReader(replacedBody))
		/* Update the size of the request based on the replaced body. */
		req.ContentLength = int64(len(replacedBody))
		ret = addedTracers
	}

	/* If an error dropped here, log it. */
	if err != nil {
		log.Error.Println(err)
	}

	return ret, err
}

/* Helper function to replace any tracer tags in request body parameters with tracer strings. Returns the replaced body
 * along with a list of randomly generated tracer strings. */
func replaceTagsInBody(body []byte) ([]byte, []string) {
	var replacedTracerStrings []string
	replacedBody := make([]byte, 0)

	/* For each of the configured tags, look for a tag in the body and swap it out for a random tracer string. */
	for _, tag := range tags {
		splitBodyOnTag := bytes.Split(body, []byte(tag))

		/* If the split returns 1 string, there were no tags in the query. Continue. */
		if len(splitBodyOnTag) != 1 {
			/* Base case. Add the left side of the tag back to the replaced body. */
			replacedBody = append(replacedBody, splitBodyOnTag[0]...)

			for i := 1; i < len(splitBodyOnTag); i++ {
				/* Generate a random tracer string. */
				randID := generateRandomTracerString()
				/* Append the generated tracer string to the new body. */
				replacedBody = append(replacedBody, randID...)
				/* Append the right side of the tracer tag to the right side of the tracer string. */
				replacedBody = append(replacedBody, splitBodyOnTag[i]...)

				/* Record the generated tracer string. */
				replacedTracerStrings = append(replacedTracerStrings, string(randID))
			}
		}
	}

	return replacedBody, replacedTracerStrings
}

/* Helper function to replace any tracer tags in request query parameters with tracer strings. Returns the replaced query
 * along with a list of the randomly generated tracer strings. */
func replaceTagsInQueryParameters(rawQuery string) (string, []string) {
	var replacedTracerStrings []string
	replacedQuery := ""

	/* For each of the configured tags, look for the tag in the query and swap it out for a random tracer string. */
	for _, tag := range tags {
		splitQueryOnTag := strings.Split(rawQuery, tag)

		/* If the split returns 1 string, there were no tags in the query. Continue. */
		if len(splitQueryOnTag) != 1 {
			/* Base case. Add the left side of a tag back to the replaced query string. */
			replacedQuery += splitQueryOnTag[0]

			for i := 1; i < len(splitQueryOnTag); i++ {
				/* Generate a random tracer string. */
				randID := generateRandomTracerString()
				/* Append the new tracer string along with the right side of the tag that was split on. */
				replacedQuery += string(randID) + splitQueryOnTag[i]
				/* Record the tracer that was generated. */
				replacedTracerStrings = append(replacedTracerStrings, string(randID))
			}
		}
	}

	return replacedQuery, replacedTracerStrings
}

/* Helper function for finding tracer strings in the response body of an HTTP request. */
func findTracersInResponseBody(response string, requestURI string, tracers []types.Tracer) map[int]types.TracerEvent {
	var tracersFound []types.Tracer
	ret := make(map[int]types.TracerEvent)

	/* For each of the tracers, look for the tracer's tracer string in the response. */
	for _, tracer := range tracers {
		index := strings.Index(response, tracer.TracerString)

		/* Negative indicates no match. Continue. */
		if index > -1 {
			log.Trace.Printf("Found a tracer! %s", tracer.TracerString)
			tracersFound = append(tracersFound, tracer)
		}
	}

	/* Create tracer event structs from the tracers that were found. */
	for _, foundTracer := range tracersFound {
		event := types.TracerEvent{
			ID:        types.Int64ToJSONNullInt64(int64(foundTracer.ID)),
			Data:      types.StringToJSONNullString(response),
			Location:  types.StringToJSONNullString(requestURI),
			EventType: types.StringToJSONNullString("Response")}
		ret[foundTracer.ID] = event
	}

	return ret
}

func init() {
	/* When the package is loaded, seed the random number generator. */
	rand.Seed(time.Now().UnixNano())
}

/* Helper function for generating random tracer strings. */
func generateRandomTracerString() []byte {
	return RandStringBytes(10)
}

/*RandStringBytes returns random string bytes based on size. */
func RandStringBytes(n int) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = alphabet[rand.Intn(len(alphabet))]
	}
	return b
}
