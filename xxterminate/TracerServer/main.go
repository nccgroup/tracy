package main

import (
	"Windy/websocket"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

//Note there is no CSRF protection
//Really everything can be get or post for now

func addTracer(w http.ResponseWriter, r *http.Request) {
	temp := tracer{}
	json.NewDecoder(r.Body).Decode(&temp)

	TracerDB.createTracer(temp.ID, temp)
}

func deleteTracer(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	id := r.Form.Get("id")
	delete(TracerDB.Tracers, id)

}

func tracerHit(w http.ResponseWriter, r *http.Request) {
	temp := tracerEvent{}
	json.NewDecoder(r.Body).Decode(&temp)

	select {
	case realTime <- temp: //This is so it does not block Note: only one person will get this for now

	}

	TracerDB.Tracers[temp.ID].logEvent(temp)
}

func listTracer(w http.ResponseWriter, r *http.Request) {
	keys := make([]string, 0, len(TracerDB.Tracers))

	for k := range TracerDB.Tracers {
		keys = append(keys, k)
	}

	tracerInfo, _ := json.Marshal(keys) //Added error handling here

	w.Write(tracerInfo)
}

func getTracer(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	id := r.Form.Get("id")
	fmt.Println(id)
	fmt.Println(TracerDB)
	traceInfo, _ := json.Marshal(TracerDB.Tracers[id])

	w.Write(traceInfo)
}

func realTimeServer(ws *websocket.Conn) {
	for event := range realTime {
		eventJSON, _ := json.Marshal(event)
		ws.Write(eventJSON)
	}
}

func testPage(w http.ResponseWriter, r *http.Request) {
	body, _ := ioutil.ReadFile("test.html")
	w.Write(body)
}

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

//I don't want to make a full DB at this time so where going to cheat and just make
// a inmemory DB
type tracerDB struct {
	Tracers map[string]tracer
}

var TracerDB tracerDB
var realTime chan tracerEvent

func main() {
	http.HandleFunc("/tracer/add", addTracer)
	http.HandleFunc("/tracer/delete", deleteTracer)
	http.HandleFunc("/tracer/hit", tracerHit)
	http.HandleFunc("/tracer/list", listTracer)
	http.HandleFunc("/tracer", getTracer)
	http.HandleFunc("/test", testPage)
	http.Handle("/realtime", websocket.Handler(realTimeServer))

	err := http.ListenAndServe(":8081", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func init() {
	realTime = make(chan tracerEvent, 10)
	TracerDB = tracerDB{}
	TracerDB.Tracers = make(map[string]tracer)

	TracerDB.createTracer("EM64q9", tracer{ID: "EM64q9", URL: "example.com", Method: "GET", Hits: make(map[string]tracerEvent)})
	TracerDB.Tracers["EM64q9"].logEvent(tracerEvent{ID: "EM64q9", Data: "hello", Location: "example.com/test", EventType: "DOM"})
	fmt.Println(TracerDB)
}

//Does this really need to be a func
func (db tracerDB) createTracer(id string, t tracer) {
	t.Hits = make(map[string]tracerEvent)
	db.Tracers[id] = t
	fmt.Println(db)
}

///There is a huge problem here of overwriting meaniful trace data. we should change this to be a hash of the data plus a function of the location or something like that
func (tr tracer) logEvent(te tracerEvent) {
	tr.Hits[te.Location+te.EventType] = te
}

// {
//    "Tracers":{
//       "test":{
//          "ID":"test",
//          "URL":"example.com",
//          "Method":"GET",
//          "Hits":{
//             "example.com/testDOM":{
//                "ID":"test",
//                "Data":"hello",
//                "Location":"example.com/test",
//                "EventType":"DOM"
//             }
//          }
//       }
//    }
// }
