package configure

import (
	"crypto/tls"
	"fmt"
	"github.com/gorilla/mux"
	"net"
	"net/http"
	"os"
	"time"
	"xxterminator-plugin/log"
	"xxterminator-plugin/tracer/rest"
	"xxterminator-plugin/tracer/store"
)

/*ProxyServer configures the TCP listener based on the user's configuration. */
func ProxyServer() net.Listener {
	addr, err := ReadConfig("proxy-server")
	if err != nil {
		log.Error.Fatal(err)
	}
	ret, err := net.Listen("tcp", addr.(string))
	if err != nil {
		/* Cannot continue if the application doesn't have TCP listener. Fail fast. */
		log.Error.Fatalf("Cannot listen on %s: %s", addr, err.Error())
	}

	return ret
}

/*Certificates loads the local certificate pairs if they exist or generates new ones on the fly. */
func Certificates() tls.Certificate {
	publicKey, err := ReadConfig("public-key-loc")
	if err != nil {
		log.Error.Fatal(err)
	}
	privateKey, err := ReadConfig("private-key-loc")
	if err != nil {
		log.Error.Fatal(err)
	}
	cer, err := tls.LoadX509KeyPair(publicKey.(string), privateKey.(string))
	if err != nil {
		/* Cannot continue if the application doesn't have a valid certificate for TLS connections. Fail fast. */
		log.Error.Fatalf("Failed to parse certificate: %s", err.Error())
	}

	return cer
}

/*ReadConfigCmd is a channel operation used to read configuration data. */
type ReadConfigCmd struct {
	key  string
	resp chan interface{}
}

/*WriteConfigCmd is a channel operation used to write configuration data. */
type WriteConfigCmd struct {
	key  string
	val  interface{}
	resp chan bool
}

/*AppendConfigCmd is a channel operation used to append configuration data. */
type AppendConfigCmd struct {
	key  string
	val  interface{}
	resp chan bool
}

/*appConfigReadChannel is used to push changes to any subscribers within the application that
 * are dependent on those configurations. */
var AppConfigReadChannel chan *ReadConfigCmd

/*appConfigWriteChannel is used to push changes to any subscribers within the application that
 * are dependent on those configurations. */
var AppConfigWriteChannel chan *WriteConfigCmd

/*appConfigAppendChannel is used to append items to list configuration options. */
var AppConfigAppendChannel chan *AppendConfigCmd

/*configurationListener listens for configuration changes and updates the global variable. */
func ConfigurationListener(initial map[string]interface{}) {
	configuration := initial
	for {
		// TODO: think this through. might get confusing.
		select {
		case read := <-AppConfigReadChannel:
			if val, ok := configuration[read.key]; ok {
				read.resp <- val
			} else {
				read.resp <- fmt.Errorf("No key %s in the current configuration", read.key)
			}
		case write := <-AppConfigWriteChannel:
			configuration[write.key] = write.val
			write.resp <- true
			//TODO: rewrite the configuration file here.
		case app := <-AppConfigAppendChannel:
			//TODO: rewrite the configuration file here.
			switch v := app.val.(type) {
			case map[string]string:
				for key, val := range v {
					configuration[app.key].(map[string]string)[key] = val
				}
			case string:
				configuration[app.key] = append(configuration[app.key].([]string), v)
			}
		}
	}
}

/*UpdateConfig updates the global configuration of the running application. */
func UpdateConfig(k string, v interface{}) {
	write := &WriteConfigCmd{
		key:  k,
		val:  v,
		resp: make(chan bool),
	}
	AppConfigWriteChannel <- write
}

/*ReadConfig read the global configuration of the running application. */
func ReadConfig(k string) (interface{}, error) {
	var err error
	read := &ReadConfigCmd{
		key:  k,
		resp: make(chan interface{}),
	}
	AppConfigReadChannel <- read
	resp := <-read.resp
	switch resp.(type) {
	case error:
		err = resp.(error)
	}

	return resp, err
}

/*AppendConfig read the global configuration of the running application. */
func AppendConfig(k string, v interface{}) {
	append := &AppendConfigCmd{
		key:  k,
		val:  v,
		resp: make(chan bool),
	}
	AppConfigAppendChannel <- append
}

/*ServerInWhitelist returns true if the server is in the whitelist. Used to block the development servers. */
func ServerInWhitelist(server string) bool {
	ret := false

	whitelist, err := ReadConfig("server-whitelist")
	if err == nil {
		for _, v := range whitelist.([]interface{}) {
			if server == v.(string) {
				ret = true
				break
			}
		}
	}

	return ret
}

/*Server configures all the HTTP routes and their corresponding handler. */
func Server() (*http.Server, *mux.Router) {
	/* Define our RESTful routes for tracers. Tracers are indexed by their database ID. */
	r := mux.NewRouter()
	r.Methods("POST").Path("/tracers").HandlerFunc(rest.AddTracer)
	r.Methods("DELETE").Path("/tracers/{tracerID}").HandlerFunc(rest.DeleteTracer)
	r.Methods("PUT").Path("/tracers/{tracerID}").HandlerFunc(rest.EditTracer)

	r.Methods("GET").Path("/tracers/events").HandlerFunc(rest.GetTracersWithEvents)
	r.Methods("GET").Path("/tracers/{tracerID}").HandlerFunc(rest.GetTracer)
	r.Methods("GET").Path("/tracers").HandlerFunc(rest.GetTracers)

	/* Define our RESTful routes for tracer events. Tracer events are indexed by their
	 * corresponding tracer ID. */
	r.Methods("POST").Path("/tracers/{tracerID}/events").HandlerFunc(rest.AddEvent)
	r.Methods("POST").Path("/tracers/events/bulk").HandlerFunc(rest.AddEvents)

	/* Define RESTful routes for labels. */
	r.Methods("POST").Path("/labels").HandlerFunc(rest.AddLabel)
	r.Methods("GET").Path("/labels").HandlerFunc(rest.GetLabels)
	r.Methods("GET").Path("/labels/{labelID}").HandlerFunc(rest.GetLabel)

	/* The base application page. */
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./tracer/view/build/")))
	/* Create the server. */
	addr, err := ReadConfig("tracer-server")
	var srv *http.Server
	if err != nil {
		log.Error.Fatal(err)
	} else {
		srv = &http.Server{
			Handler: r,
			Addr:    addr.(string),
			// Good practice: enforce timeouts for servers you create!
			WriteTimeout: 15 * time.Second,
			ReadTimeout:  15 * time.Second,
		}
	}
	/* Return the server and the router. The router is mainly used for testing. */
	return srv, r
}

/*Database opens the database from the store package. The resultant DB is available
 * via the TracerDB global. */
func Database(db string) {
	/* Open the database file. */
	_, err := store.Open("sqlite3", db)
	if err != nil {
		/* Can't really recover here. We need the database. */
		log.Error.Fatal(err)
	}
}

/*DeleteDatabase deletes the database at the file path specified. */
func DeleteDatabase(db string) error {
	var ret error

	/* If the database exists, remove it. It will affect the test. */
	if _, err := os.Stat(db); !os.IsNotExist(err) {
		err := os.Remove(db)
		if err != nil {
			ret = fmt.Errorf("wasn't able to delete the database at: %s", db)
		}
	}

	return ret
}
