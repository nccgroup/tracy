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
	"xxterminator-plugin/xxterminate/TracerServer/types"
)

//{"TracerString": "%s", "URL": "%s", "Method": "%s"}

//TODO: These should be in a config file

//TAG used to insert tracers
const TAG = "{{XSS}}"

//TRACERSERVER is location of the tracer server
const TRACERSERVER = "http://localhost:8081"

//by passing by star I think it is no longer a copy. These means  Idon't have to return it?
//Also is it silly to do it this way. I feel like it would be easer to do it once by just getting the byte array of the request and just sending that
func addTracers(req *http.Request) error {
	//do get parms
	var addedTracers []types.Tracer

	newQuary, tracersQuary, _ := addTracersQuery(req.URL.RawQuery)
	req.URL.RawQuery = newQuary

	for _, tracerString := range tracersQuary {
		tracer := types.Tracer{TracerString: tracerString, URL: types.StringToJSONNullString(req.URL.EscapedPath()), Method: types.StringToJSONNullString(req.Method)}
		addedTracers = append(addedTracers, tracer)
	}

	//do request body
	requestData, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return err
	}

	newRequest, tracersBody, _ := addTracersBody(requestData)

	for _, tracerString := range tracersBody {
		tracer := types.Tracer{TracerString: tracerString, URL: types.StringToJSONNullString(req.URL.EscapedPath()), Method: types.StringToJSONNullString(req.Method)}
		addedTracers = append(addedTracers, tracer)
	}

	req.Body = ioutil.NopCloser(bytes.NewReader(newRequest))
	req.ContentLength = int64(len(newRequest)) //Update the size of the request or it will not work

	go sendTracersToServer(addedTracers)

	return nil
}

func addTracersBody(requestData []byte) ([]byte, []string, error) {
	var addedTracers []string

	splitRequestData := bytes.Split(requestData, []byte(TAG))

	if len(splitRequestData) == 1 {
		return requestData, nil, nil
	}

	newRequest := make([]byte, 0)
	newRequest = append(newRequest, splitRequestData[0]...)

	for i := 1; i < len(splitRequestData); i++ {
		randID := RandStringBytes(5)

		newRequest = append(newRequest, randID...)
		newRequest = append(newRequest, splitRequestData[i]...)

		addedTracers = append(addedTracers, string(randID))
	}

	return newRequest, addedTracers, nil
}

//TODO: This function does not return a error so we really don't need it
func addTracersQuery(rawQuary string) (string, []string, error) {
	var addedTracers []string
	reqSplitQuery := strings.Split(rawQuary, TAG)

	if len(reqSplitQuery) != 1 {
		newQuery := reqSplitQuery[0]

		for i := 1; i < len(reqSplitQuery); i++ {
			randID := getRandomID()
			newQuery += string(randID) + reqSplitQuery[i]
			addedTracers = append(addedTracers, string(rawQuary))
		}

		return rawQuary, addedTracers, nil
	}

	//There is no tracers to add
	return rawQuary, nil, nil

}

func getRandomID() []byte {
	return RandStringBytes(5)
}

func sendTracersToServer(tracers []types.Tracer) error {
	//TODO: Add more error handling here for invalid server request
	for _, tracer := range tracers {
		tracerJSON, err := json.Marshal(tracer) //
		if err != nil {
			log.Println("Failed to Marshal tracer")
			return err
		}

		http.Post(TRACERSERVER+"/tracer", "application/json; charset=UTF-8", bytes.NewBuffer(tracerJSON))
	}

	return nil
}

func getTracerList() (map[int]types.Tracer, error) {
	tracerListResp, err := http.Get(TRACERSERVER + "/tracers")
	if err != nil {
		log.Printf("Unable to get list of tracers")
		return nil, err
	}
	defer tracerListResp.Body.Close()

	tracerListbody, err := ioutil.ReadAll(tracerListResp.Body)
	if err != nil {
		log.Println("Unable to get Tracer List Body")
		return nil, err
	}

	var tracers map[int]types.Tracer // This is a real waste of space as we only need the IDS but oh well maybe later

	err = json.Unmarshal(tracerListbody, tracers)
	if err != nil {
		log.Fatal("failed to unmarshal request")
		return nil, err
	}

	return tracers, nil
}

func sendTracerEventsToServer(tracerEvents map[string]types.TracerEvent) error {
	for tracerString, tracerEvent := range tracerEvents {

		eventData, err := json.Marshal(tracerEvent)
		if err != nil {
			log.Println("failed to marshel Event")
			return err
		}

		//TODO: Add error handling for invalid request
		_, err = http.Post(TRACERSERVER+"/tracers/"+tracerString+"/events", "application/json; charset=UTF-8", bytes.NewBuffer(eventData))
		if err != nil {
			log.Println("failed trying to build an HTTP request")
			return err
		}
	}
	return nil
}

func proccessResponseTracers(resp http.Response) error {

	responseRawBytes, err := httputil.DumpResponse(&resp, true)
	if err != nil {
		log.Fatal("unable to get Raw response for proccessResponse")
		return err
	}
	responseString := string(responseRawBytes)

	tracers, err := getTracerList()
	if err != nil {
		return err
	}

	foundTracers := findTracers(responseString, tracers)

	location, _ := resp.Location()
	var tracerEvents map[string]types.TracerEvent

	for _, foundTracer := range foundTracers {
		event := types.TracerEvent{ID: types.Int64ToJSONNullInt64(int64(foundTracer.ID)), Data: types.StringToJSONNullString(responseString),
			Location: types.StringToJSONNullString(location.String()), EventType: types.StringToJSONNullString("Response")}
		tracerEvents[foundTracer.TracerString] = event
	}

	sendTracerEventsToServer(tracerEvents)

	return nil
}

func findTracers(responseString string, tracers map[int]types.Tracer) []types.Tracer {
	var tracersFound []types.Tracer
	for _, tracer := range tracers {
		index := strings.Index(responseString, tracer.TracerString)

		if index > -1 {
			tracersFound = append(tracersFound, tracer)
		}
	}
	return tracersFound

}

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

func init() {
	rand.Seed(time.Now().UnixNano())
}

//RandStringBytes returns random string bytes based on size
func RandStringBytes(n int) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}
	return b
}
