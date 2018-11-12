package proxy

import (
	"bytes"
	"fmt"
	"math/rand"
	"net/url"
	"strings"
	"time"

	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
)

// replaceTracerStrings replaces any tracer strings in a slice of bytes
// with tracer payloads. Returns the replaced slicey along with a list of
// tracers used to replace the tracer strings. */
func replaceTracerStrings(data []byte) ([]byte, []types.Tracer) {
	var (
		replacedTracers []types.Tracer
		labels          [][]byte
	)
	for s := range configure.Current.TracerStrings {
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
