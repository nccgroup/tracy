package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"testing"
	"time"
	"xxterminator-plugin/xxterminate/TracerServer/tracer"
	"context"
)

/* Testing the addTracer route. */
func TestAddTracer(t *testing.T) {
	/* Add a new tracer and test it was properly added to the database. */
	fp := func() {
		var (
			trcr_str= "blahblah"
			url 	= "http://example.com"
			method  = "GET"
		)
		json_str := fmt.Sprintf(`{"TracerString": "%s", "URL": "%s", "Method": "%s"}`,
			trcr_str, url, method)
		t.Logf("Sending the following data: %s\n", json_str)

		req, err := http.NewRequest("POST", "http://127.0.0.1:8081/tracers", bytes.NewBuffer([]byte(json_str)))
		if err != nil {
			t.Errorf("Tried to build an HTTP request but got the following error: %+v\n", err)
		}
		client := &http.Client{}
		resp, err := client.Do(req)
		defer resp.Body.Close()
		if err != nil {
			t.Errorf("Tried to make the POST request, %+v, but got an error: %+v\n", req, err)
		}
		t.Logf("Got the following response: %+v\n", resp)

		/* Make sure the response is what we expect. */
		trcr := tracer.Tracer{}
		body_bytes, err := ioutil.ReadAll(resp.Body)
		body_str := string(body_bytes)
		/* Then, close the response body IO. */
		t.Logf("Received the following data from the response: %s\n", body_str)
		json.Unmarshal([]byte(body_str), &trcr)
		t.Logf("Unmarshalled the data in the following way: %+v\n", trcr)
		if trcr.ID != 1 {
			t.Errorf("The inserted tracer has the wrong ID. Expected 0, got: %d\n", trcr.ID)
		}
		if trcr.URL.String != url {
			t.Errorf("The inserted tracer has the wrong URL. Expected: %s, got: %s\n", url, trcr.URL.String)
		}
		if trcr.Method.String != method {
			t.Errorf("The inserted tracer has the wrong Method. Expected %s, got: %s\n", method, trcr.Method.String)
		}
	}

	/* Run our function on the server. */
	serverHelper(fp, t)
}

/* Helper function for starting the server and shutting it down. Pass it a function
 * and it will run it for you and throw the errors. */
func serverHelper(fp func(), t *testing.T) {
	/* Delete any existing database entries */
	deleteDatabase(t)
	/* Open the database because the init method from main.go won't trigger. */
	openDatabase()
	/* Configure the server. */
	srv := configureServer()

	/* Start it up (needs to be in a goroutine so we can stop it.) */
	go func() {
		srv.ListenAndServe()
	}()

	/* Give it some time to setup. */
	time.Sleep(1 * time.Second)

	/* Call the server test method. */
	fp()

	/* Shut it down. */
	err := srv.Shutdown(context.Background())
	if err != nil {
		t.Error("Tried to shut down the server, but got an error: ", err)
	}

	/* Close the database handle. */
	TracerDB.Close()
}

/* Delete any existing database */
func deleteDatabase(t *testing.T) {
	/* Find the path of this package. */
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		t.Errorf("No caller information, therefore, can't find the database.")
	}
	/* Should be something like $GOPATH/src/xxterminator-plugin/xxtermiate/TracerServer/store/tracer-db.db */
	db_loc := path.Dir(filename) + string(filepath.Separator) + "store" + string(filepath.Separator) + "tracer-db.db"
	/* If the database exists, remove it. It will affect the test. */
	if _, err := os.Stat(db_loc); !os.IsNotExist(err) {
		err := os.Remove(db_loc)
		if err != nil {
			t.Errorf("Wasn't able to delete the database at: %s\n", db_loc)
		}
	}
}
