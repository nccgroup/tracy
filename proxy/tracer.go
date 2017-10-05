package proxy

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"math/rand"
	"net/http"
	"strings"
	"time"
	"xxterminator-plugin/tracer/types"
	"xxterminator-plugin/log"
	"fmt"
)

//{"TracerString": "%s", "URL": "%s", "Method": "%s"}

//TODO: These should be in a config file

//TAG used to insert tracers
var TAG = []string{"{{XSS}}", "%7B%7BXSS%7D%7D"}

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
	defer req.Body.Close()
	if err != nil {
		log.Error.Println(err)
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

	newRequest := requestData
	for _, tag := range TAG {
		splitRequestData := bytes.Split(newRequest, []byte(tag))

		if len(splitRequestData) == 1 {
			continue
		}

		newRequest = append(newRequest, splitRequestData[0]...)

		for i := 1; i < len(splitRequestData); i++ {
			randID := RandStringBytes(5)

			newRequest = append(newRequest, randID...)
			newRequest = append(newRequest, splitRequestData[i]...)

			addedTracers = append(addedTracers, string(randID))
		}
	}

	return newRequest, addedTracers, nil
}

//TODO: This function does not return a error so we really don't need it
func addTracersQuery(rawQuary string) (string, []string, error) {
	var addedTracers []string
	query := rawQuary
	for _, tag := range TAG {
		reqSplitQuery := strings.Split(query, tag)

		if len(reqSplitQuery) != 1 {
			newQuery := reqSplitQuery[0]

			for i := 1; i < len(reqSplitQuery); i++ {
				randID := getRandomID()
				newQuery += string(randID) + reqSplitQuery[i]
				addedTracers = append(addedTracers, string(query))
			}
		}
	}

	//There is no tracers to add
	return query, addedTracers, nil

}

func getRandomID() []byte {
	return RandStringBytes(5)
}

func sendTracersToServer(tracers []types.Tracer) error {
	log.Trace.Println("Sending tracers to the server.")
	//TODO: Add more error handling here for invalid server request
	for _, tracer := range tracers {
		tracerJSON, err := json.Marshal(tracer) //
		log.Trace.Println("tracer JSON: %s", string(tracerJSON))
		if err != nil {
			log.Trace.Println("Failed to Marshal tracer")
			return err
		}

		http.Post(TRACERSERVER+"/tracers", "application/json; charset=UTF-8", bytes.NewBuffer(tracerJSON))
	}

	return nil
}

func getTracerList() (map[string]types.Tracer, error) {
	tracerListResp, err := http.Get(TRACERSERVER + "/tracers")
	if err != nil {
		log.Error.Println("Unable to get list of tracers")
		return nil, err
	}
	defer tracerListResp.Body.Close()

	tracerListbody, err := ioutil.ReadAll(tracerListResp.Body)
	if err != nil {
		log.Error.Println("Unable to get Tracer List Body")
		return nil, err
	}

	tracers := make(map[string]types.Tracer) // This is a real waste of space as we only need the IDS but oh well maybe later

	err = json.Unmarshal(tracerListbody, &tracers)
	log.Trace.Println("tracerListBody: %s", string(tracerListbody))
	if err != nil {
		log.Error.Println("Failed to unmarshal request")
		return nil, err
	}

	return tracers, nil
}

func sendTracerEventsToServer(tracerEvents map[int]types.TracerEvent) error {
	for tracerID, tracerEvent := range tracerEvents {

		eventData, err := json.Marshal(tracerEvent)
		if err != nil {
			log.Error.Println("failed to marshel Event")
			return err
		}

		//TODO: Add error handling for invalid request
		_, err = http.Post(fmt.Sprintf("%s/tracers/%d/events", TRACERSERVER, tracerID), "application/json; charset=UTF-8", bytes.NewBuffer(eventData))
		if err != nil {
			log.Error.Println("failed trying to build an HTTP request")
			return err
		}
	}
	return nil
}

func proccessResponseTracers(responseRawBytes []byte, requestUri string) error {
	responseString := string(responseRawBytes)

	tracers, err := getTracerList()
	if err != nil {
		return err
	}

	foundTracers := findTracers(responseString, tracers)
	tracerEvents := make(map[int]types.TracerEvent)

	for _, foundTracer := range foundTracers {
		event := types.TracerEvent{ID: types.Int64ToJSONNullInt64(int64(foundTracer.ID)), Data: types.StringToJSONNullString(responseString),
			Location: types.StringToJSONNullString(requestUri), EventType: types.StringToJSONNullString("Response")}
		tracerEvents[foundTracer.ID] = event
	}

	sendTracerEventsToServer(tracerEvents)

	return nil
}

func findTracers(responseString string, tracers map[string]types.Tracer) []types.Tracer {
	var tracersFound []types.Tracer
	for _, tracer := range tracers {
		index := strings.Index(responseString, tracer.TracerString)

		if index > -1 {
			log.Trace.Printf("Found a tracer! %s", tracer.TracerString)
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
