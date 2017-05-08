package main

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"net/http/httputil"
	"strings"
	"time"
)

type tracer struct {
	ID     string
	URL    string
	Method string
	Hits   map[string]tracerEvent
}

type tracerEvent struct {
	ID        string //ok This is silly to add this here we should know the id but for now I am adding it because it makes it easy to
	Data      string
	Location  string
	EventType string
}

//by passing by star I think it is no longer a copy. These means  Idon't have to return it?
//Also is it silly to do it this way. I feel like it would be easer to do it once by just getting the byte array of the request and just sending that
func addTracer(req *http.Request) error {
	//do get parms

	reqSplitQuery := strings.Split(req.URL.RawQuery, "XSS")

	if len(reqSplitQuery) != 1 {
		newQuery := reqSplitQuery[0]

		for i := 1; i < len(reqSplitQuery); i++ {
			newQuery += string(RandStringBytes(5)) + reqSplitQuery[i]
		}
		req.URL.RawQuery = newQuery
	}

	//do request body
	reqData, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil
	}

	splitReqData := bytes.Split(reqData, []byte("XSS"))
	log.Println(splitReqData)
	//No tracers to add
	if len(splitReqData) == 1 {
		req.Body = ioutil.NopCloser(bytes.NewReader(reqData)) // I don't understand how this work. I think I need to do this to readd the body into the request but I could be wrong. I should test
		return nil
	}

	newRequest := make([]byte, 0)
	newRequest = append(newRequest, splitReqData[0]...)

	for i := 1; i < len(splitReqData); i++ {
		randID := RandStringBytes(5)
		newRequest = append(newRequest, randID...)
		newRequest = append(newRequest, splitReqData[i]...)
		log.Println(string(newRequest))
		trac := tracer{ID: string(randID), URL: req.URL.EscapedPath(), Method: req.Method}
		tracJSON, _ := json.Marshal(trac)
		http.Post("http://localhost:8081/tracer/add", "application/json; charset=UTF-8", bytes.NewBuffer(tracJSON))
	}

	req.Body = ioutil.NopCloser(bytes.NewReader(newRequest))
	req.ContentLength = int64(len(newRequest)) //this could overflow
	dump, _ := httputil.DumpRequest(req, true)

	log.Println("ModString:")
	log.Println(string(dump))

	return nil
}

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

func init() {
	rand.Seed(time.Now().UnixNano())
}

func RandStringBytes(n int) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}
	return b
}
