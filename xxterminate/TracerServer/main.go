package main

import (
	"Windy/websocket"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"xxterminator-plugin/xxterminate/TracerServer/store"
	"xxterminator-plugin/xxterminate/TracerServer/tracer"
	"database/sql"
	"runtime"
	"path"
	"path/filepath"
)

//Note there is no CSRF protection
//Really everything can be get or post for now

func addTracer(w http.ResponseWriter, r *http.Request) {
	temp := tracer.Tracer{}
	json.NewDecoder(r.Body).Decode(&temp)

	/*TracerDB.createTracer(temp.ID, temp)*/
	err := store.AddTracer(TracerDB, temp)
	if err != nil {
		log.Fatal(err)
	}
}

func deleteTracer(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	id := r.Form.Get("id")
	//delete(TracerDB.Tracers, id)
	err := store.DeleteTracer(TracerDB, id)
	if err != nil {
		log.Fatal(err)
	}

}

func tracerHit(w http.ResponseWriter, r *http.Request) {
	temp := tracer.TracerEvent{}
	json.NewDecoder(r.Body).Decode(&temp)

	select {
	case realTime <- temp: //This is so it does not block Note: only one person will get this for now

	}

	//TracerDB.Tracers[temp.ID].logEvent(temp)
	//GetTracer(TracerDB, temp.Url)
}

func getTracers(w http.ResponseWriter, r *http.Request) {
	//keys := make([]string, 0, len(TracerDB.Tracers))

	//for k := range TracerDB.Tracers {
	//	keys = append(keys, k)
	//}

	//tracerInfo, _ := json.Marshal(keys) //Added error handling here
	tracers, err := store.GetTracers(TracerDB)
	if err != nil {
		log.Fatal(err)
	}
	tracerInfo, err := json.Marshal(tracers) //Added error handling here

	if err != nil {
		log.Fatal(err)
	}

	w.Write(tracerInfo)
}

func getTracer(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	id := r.Form.Get("id")
	//traceInfo, _ := json.Marshal(TracerDB.Tracers[id])
	t, err := store.GetTracer(TracerDB, id)
	if err != nil {
		log.Fatal(err)
	}
	tracerInfo, err := json.Marshal(t)
	if err != nil {
		log.Fatal(err)
	}
	w.Write(tracerInfo)
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

//var TracerDB tracerDB
var TracerDB *sql.DB
var realTime chan tracer.TracerEvent

/* Database configuration strings. Make these configurable. */
var driver string = "sqlite3"
/* Configured by the init function. */
var db_loc string

func main() {
	http.HandleFunc("/tracer/add", addTracer)
	http.HandleFunc("/tracer/delete", deleteTracer)
	http.HandleFunc("/tracer/hit", tracerHit)
	http.HandleFunc("/tracer/list", getTracers)
	http.HandleFunc("/tracer", getTracer)
	http.HandleFunc("/test", testPage)
	http.Handle("/realtime", websocket.Handler(realTimeServer))

	err := http.ListenAndServe(":8081", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}

}

func init() {
	/* Find the path of this package. */
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		log.Fatal("No caller information, therefore, can't find the database.")
	}
	/* Should be something like $GOPATH/src/xxterminator-plugin/xxtermiate/TracerServer/store/tracer-db.db */
	db_loc = path.Dir(filename) + string(filepath.Separator) + "store" + string(filepath.Separator) + "tracer-db.db"

	realTime = make(chan tracer.TracerEvent, 10)
	//TracerDB = tracerDB{}
	//TracerDB.Tracers = make(map[string]Tracer)
	var err error
	TracerDB, err = store.Open(driver, db_loc)
	if err != nil {
		/* Can't really recover here. We need the database. */
		log.Fatal(err)
	}

	//TracerDB.createTracer("EM64q9", Tracer{ID: "EM64q9", URL: "example.com", Method: "GET", Hits: make(map[string]tracerEvent)})
	err = store.AddTracer(
		TracerDB,
		tracer.Tracer{ID: 1, TracerString: "EM64q9", URL: "example.com", Method: "GET", Hits: make([]tracer.TracerEvent, 0)})
	if err != nil {
		log.Fatal(err)
	}
	t, err := store.GetTracer(TracerDB, "EM64q9")
	if err != nil {
		log.Fatal(err)
	}
	t.LogEvent(tracer.TracerEvent{ID: 1, Data: "hello", Location: "example.com/test", EventType: "DOM"})
	//TracerDB.Tracers["EM64q9"].logEvent(tracerEvent{ID: "EM64q9", Data: "hello", Location: "example.com/test", EventType: "DOM"})
	//fmt.Println(TracerDB)
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
