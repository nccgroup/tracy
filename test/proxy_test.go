package test

import (
	"bufio"
	"bytes"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"testing"
	"tracy/log"
	"tracy/proxy"
	"tracy/tracer/types"
)

var requestDataNoTags = `GET /api/v1/action/ HTTP/1.1
Host: normandy.cdn.mozilla.net
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:55.0) Gecko/20100101 Firefox/55.0
Accept: application/json
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
origin: null
Connection: close

`

//If you update this test don't forgot to update the content link
var requestDataTags = `POST /test?echo={{XSS}} HTTP/1.1
Host: test.com
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:55.0) Gecko/20100101 Firefox/55.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Content-Length: 91
Content-Type: text/plain
Connection: close
Pragma: no-cache
Cache-Control: no-cache

test={{XSS}}&f={{ffff}&%7B%7BXSS%7D%7D&fff={{PLAIN}}&jjj=%7B%7BX&{{ddd}}&fdfd=%7B%7BX%7D%7D`

func TestAddTracersBodyWithNoTags(t *testing.T) {
	numTracers, err := testAddTracersBodyHelper(requestDataNoTags)
	if err != nil {
		t.Fatalf("tried to read parse but got the following error: %+v", err)
	} else if numTracers != 0 {
		t.Fatalf("Failed to find tracers")
	}
}

func TestAddTracersBodyWithTags(t *testing.T) {
	numTracers, err := testAddTracersBodyHelper(requestDataTags)
	if err != nil {
		t.Fatalf("tried to read parse but got the following error: %+v", err)
	} else if numTracers != 3 {
		t.Fatalf("Failed to find tracers")
	}
}

func testAddTracersBodyHelper(requestDataString string) (int, error) {
	request, err := http.ReadRequest(bufio.NewReader(strings.NewReader(requestDataString)))
	if err != nil {
		return 0, err
	}

	requestData, err := ioutil.ReadAll(request.Body)
	if err != nil {
		return 0, err
	}

	newRequest, addedTracers := proxy.ReplaceTagsInBody(requestData)

	for _, addedTracer := range addedTracers {
		i := bytes.Index(newRequest, []byte(addedTracer))
		if i == -1 {
			return 0, fmt.Errorf("Could not find Tracer")
		}
	}

	return len(addedTracers), nil
}

func TestAddTracersQueryNoTags(t *testing.T) {
	numTracers, err := testAddTracerQuaryHelper(requestDataNoTags)
	if err != nil {
		t.Fatalf("Failed to insert Tracers with error: %+v", err)
	} else if numTracers != 0 { //1 is the number of exspected tracers
		t.Fatal("Failed to find all Tracers")
	}
}

func TestAddTracersQueryTags(t *testing.T) {
	numTracers, err := testAddTracerQuaryHelper(requestDataTags)
	if err != nil {
		t.Fatalf("Failed to insert Tracers with error: %+v", err)
	} else if numTracers != 1 { //1 is the number of exspected tracers
		t.Fatal("Failed to find all Tracers")
	}
}

func testAddTracerQuaryHelper(requestData string) (int, error) {
	request, err := http.ReadRequest(bufio.NewReader(strings.NewReader(requestData)))
	if err != nil {
		return 0, err
	}

	newQuary, addedTracers := proxy.ReplaceTagsInQueryParameters(request.URL.RawQuery)

	for _, addedTracer := range addedTracers {
		i := strings.Index(newQuary, addedTracer)
		if i == -1 {
			return 0, fmt.Errorf("no tracer found")
		}
	}
	return len(addedTracers), nil
}

var responseStringTracer = `HTTP/1.1 200 OK
Date: Tue, 03 Oct 2017 20:45:47 GMT
Content-Length: 80
Content-Type: text/plain; charset=utf-8
Connection: close

{"ID":1,"Data":"an event!","Location":"AASDFG","EventType":"a type of event"}`

var responseStringNoTracer = `HTTP/1.1 200 OK
Date: Tue, 03 Oct 2017 20:45:47 GMT
Content-Length: 80
Content-Type: text/plain; charset=utf-8
Connection: close

{"ID":1,"Data":"an event!","Location":"aa","EventType":"a type of event"}`

func TestFindTracers(t *testing.T) {
	//findTracers(responseString string, tracers map[int]types.Tracer) []types.Tracer {
	tracers := make([]types.Tracer, 1)
	tracer := types.Tracer{TracerString: "AASDFG"}
	tracers[0] = tracer

	numHits, err := testFindTracersHelper(responseStringTracer, tracers)

	if err != nil {
		t.Fatal("Magic just happened") //error should always be null
	} else if numHits != 1 {
		t.Fatal("Failed to find tracer")
	}
}

func TestFindNoTracers(t *testing.T) {
	//findTracers(responseString string, tracers map[int]types.Tracer) []types.Tracer {
	tracers := make([]types.Tracer, 1)
	tracer := types.Tracer{TracerString: "AASDFG"}
	tracers[0] = tracer

	numHits, err := testFindTracersHelper(responseStringNoTracer, tracers)

	if err != nil {
		t.Fatal("Magic just happened") //error should always be null
	} else if numHits != 0 {
		t.Fatal("Failed to find tracer")
	}
}

func testFindTracersHelper(responseData string, tracers []types.Tracer) (int, error) {
	foundTracers := proxy.FindTracersInResponseBody(responseData, "www.test.com", tracers)

	return len(foundTracers), nil
}

func init() {
	log.Init()
}
