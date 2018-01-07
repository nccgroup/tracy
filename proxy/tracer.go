package proxy

import (
	"bytes"
	"io/ioutil"
	"math/rand"
	"net/http"
	"net/url"
	"strings"
	"time"
	"xxterminator-plugin/configure"
	"xxterminator-plugin/log"
	"xxterminator-plugin/tracer/types"
)

/* Helper function for searching for tracer tags in query parameters and body and replacing them with randomly generated
 * tracer string. Also, it submits the generated tracers to the API. This should be moved out, though. */
func replaceTracers(req *http.Request) ([]types.Tracer, error) {
	/* Search the query string for any tags that need to be replaced with tracer strings and replace them. */
	replacedQueryString, replacedTracerStrings := ReplaceTagsInQueryParameters(req.URL.RawQuery)
	/* Write the new query string to the request. */
	req.URL.RawQuery = replacedQueryString
	var ret []types.Tracer

	/* Read the HTTP request body. */
	requestData, err := ioutil.ReadAll(req.Body)
	if err == nil {
		defer req.Body.Close()

		/* Search the body for any tags that need to be replaced with tracer strings and replace them. */
		replacedBody, replacedTracerStringsInBody := ReplaceTagsInBody(requestData)

		/* Combine the two slices of new tracer strings. */
		replacedTracerStrings = append(replacedTracerStrings, replacedTracerStringsInBody...)
		/* Create tracer structs out of the generated tracer strings. */
		addedTracers := make([]types.Tracer, len(replacedTracerStrings))
		for i := 0; i < len(replacedTracerStrings); i++ {
			fullURL := types.StringToJSONNullString(req.Host + req.RequestURI) //capture host, path, and query params
			addedTracers[i] = types.Tracer{
				TracerString: replacedTracerStrings[i],
				URL:          fullURL,
				Method:       types.StringToJSONNullString(req.Method),
			}
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

/*ReplaceTagsInBody is a helper function to replace any tracer tags in request body
 * parameters with tracer strings. Returns the replaced body along with a list of
 * randomly generated tracer strings. */
func ReplaceTagsInBody(body []byte) ([]byte, []string) {
	var replacedTracerStrings []string
	replacedBody := make([]byte, 0)

	for i := 0; i < len(body); i++ {

		if i+2 < len(body) && bytes.Compare(body[i:i+2], []byte("{{")) == 0 {

			log.Trace.Printf("Found the  start of a tracer tag")

			tag := []byte{'{', '{'}
			for j := i + 2; j < len(body) && body[j] != 0x25 && body[j] != 0x7B && body[j] != 0x7D; j++ {
				tag = append(tag, body[j])
			}

			if len(tag)+i+1 < len(body) && bytes.Compare(body[len(tag)+i:len(tag)+i+2], []byte("}}")) == 0 {
				tag = append(tag, byte('}'), byte('}'))
				tracerString, tracerBytes := generateTracerFromTag(string(tag))

				if tracerString == "" {
					replacedBody = append(replacedBody, tag...)
				} else {
					replacedBody = append(replacedBody, tracerBytes...)
					log.Trace.Printf("Found a tag with value of: %s", string(tag))
					replacedTracerStrings = append(replacedTracerStrings, tracerString)
				}

				i += len(tag) - 1
				continue
			} else {
				log.Trace.Printf("Found a none tag with value of: %s", string(tag))
				i += len(tag) - 1
				replacedBody = append(replacedBody, tag...)
				continue
			}
		}

		if i+7 < len(body) && bytes.Compare(body[i:i+6], []byte("%7B%7B")) == 0 {

			log.Trace.Printf("Found the  start of a tracer tag")

			tag := []byte("%7B%7B")

			for j := i + 6; j < len(body) && body[j] != 0x25 && body[j] != 0x7B && body[j] != 0x7D; j++ {
				tag = append(tag, body[j])
			}

			if len(tag)+i+5 < len(body) && bytes.Compare(body[len(tag)+i:len(tag)+i+6], []byte("%7D%7D")) == 0 {
				tag = append(tag, []byte("%7D%7D")...)
				tracerString, tracerBytes := generateTracerFromTag(string(tag))

				if tracerString == "" {
					replacedBody = append(replacedBody, tag...)
				} else {
					replacedBody = append(replacedBody, tracerBytes...)
					log.Trace.Printf("Found a tag with value of: %s", string(tag))
					replacedTracerStrings = append(replacedTracerStrings, tracerString)
				}

				i += len(tag) - 1
				continue
			} else {
				log.Trace.Printf("Found a none tag with value of: %s", string(tag))
				i += len(tag) - 1
				replacedBody = append(replacedBody, tag...)
				continue
			}

		}

		//If no tag start of tag is found just append the byte
		replacedBody = append(replacedBody, body[i])
	}

	log.Trace.Printf("New Body Value: %s %d", string(replacedBody), len(replacedBody))

	return replacedBody, replacedTracerStrings
}

/* Helper function that returns a random string that is used to track the tracer and the actual payload
 * as a slice of bytes. */
func generateTracerFromTag(tag string) (string, []byte) {
	idTag := "[[ID]]"
	unescapedTag, err := url.QueryUnescape(tag)

	if err == nil {
		labels, err := configure.ReadConfig("tracers")
		if err == nil {
			for tracer, payload := range labels.(map[string]interface{}) {
				if unescapedTag == tracer {
					randID := generateRandomTracerString()
					return string(randID), []byte(strings.Replace(payload.(string), idTag, string(randID), 1))
				}
			}
		}
	}

	//No tag found
	return "", nil
}

/*ReplaceTagsInQueryParameters is a helper function to replace any tracer tags
 * in request query parameters with tracer strings. Returns the replaced query
 * along with a list of the randomly generated tracer strings. */
func ReplaceTagsInQueryParameters(rawQuery string) (string, []string) {
	replacedQuery, replacedTracerStrings := ReplaceTagsInBody([]byte(rawQuery))

	return string(replacedQuery), replacedTracerStrings
}

/*FindTracersInResponseBody is a helper function for finding tracer strings in
 * the response body of an HTTP request. */
func FindTracersInResponseBody(response string, url string, tracers []types.Tracer) map[int]types.TracerEvent {
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
			Data:      types.StringToJSONNullString(response),
			Location:  types.StringToJSONNullString(url),
			EventType: types.StringToJSONNullString("Response"),
		}
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

//Note: now it will only make strings with low case tags. This might be a problem if there is a lot of random text on the page .
const alphabet = "abcdefghijklmnopqrstuvwxyz"

/*RandStringBytes returns random string bytes based on size. */
func RandStringBytes(n int) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = alphabet[rand.Intn(len(alphabet))]
	}
	return b
}
