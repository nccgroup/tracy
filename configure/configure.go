package configure

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	l "log"
	"net"
	"os"
	"os/user"
	"path/filepath"
	"strings"
	"tracy/log"
	"tracy/tracer/store"
)

/*TracyPath is the path all tracy files go in. */
var TracyPath string

/*DatabaseFile is the database file configured through the command line. */
var DatabaseFile string

/*DebugUI is the flag used to tell if the user is debugging the UI. */
var DebugUI bool

func init() {
	usr, err := user.Current()
	if err != nil {
		l.Fatal(err)
	}

	TracyPath = filepath.Join(usr.HomeDir, ".tracy")
	if _, err = os.Stat(TracyPath); os.IsNotExist(err) {
		os.Mkdir(TracyPath, 0755)
	}

	/* Write the server certificates. */
	pubKeyPath := filepath.Join(TracyPath, "cert.pem")
	if _, err = os.Stat(pubKeyPath); os.IsNotExist(err) {
		generateRootCA(TracyPath)
	}
	privKeyPath := filepath.Join(TracyPath, "key.pem")
	if _, err = os.Stat(privKeyPath); os.IsNotExist(err) {
		generateRootCA(TracyPath)
	}

	/* Read the configuration. */
	configPath := filepath.Join(TracyPath, "tracer.json")
	var content []byte
	if _, err = os.Stat(configPath); os.IsNotExist(err) {
		/* Try to recover by writing a new tracer.json file with the default values. */
		pubKeyPath = strings.Replace(pubKeyPath, "\\", "\\\\", -1)
		privKeyPath = strings.Replace(privKeyPath, "\\", "\\\\", -1)
		def := fmt.Sprintf(DefaultConfig, pubKeyPath, privKeyPath)
		/* Make sure to escape the path variables in windows paths. */
		ioutil.WriteFile(configPath, []byte(def), 0755)
		content = []byte(def)
	} else {
		content, err = ioutil.ReadFile(configPath)
		if err != nil {
			l.Fatal(err)
		}
	}

	var configData interface{}
	err = json.Unmarshal(content, &configData)
	if err != nil {
		l.Fatalf("Configuration file has a JSON syntax error: %s", err.Error())
	}

	/* Create the configuration channel listener to synchronize configuration changes. */
	AppConfigReadChannel = make(chan *ReadConfigCmd, 10)
	AppConfigWriteChannel = make(chan *WriteConfigCmd, 10)
	AppConfigAppendChannel = make(chan *AppendConfigCmd, 10)
	AppConfigAllChannel = make(chan *AllConfigCmd, 10)
	go ConfigurationListener(configData.(map[string]interface{}))

	/* Set up the command line interface. */
	var (
		databaseFileUsage   = "Indicate the file to use for the SQLite3 database. By default, a temporary one is picked."
		databaseFileDefault = "prod-tracer-db.db"
		debugUIUsage = "Indicate if you'd like the UI to use the non-compiled assets in the case of debugging."
	)
	/* Database file. Allows the user to change the location of the SQLite database file. */
	flag.StringVar(&DatabaseFile, "database", filepath.Join(TracyPath, databaseFileDefault), databaseFileUsage)
	flag.StringVar(&DatabaseFile, "d", filepath.Join(TracyPath, databaseFileDefault), databaseFileUsage)
	flag.BoolVar(&DebugUI, "debug-ui", false, debugUIUsage)
	flag.BoolVar(&DebugUI, "du", false, debugUIUsage+"(shorthand)")
}

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

/*AllConfigCmd is a channel operation used to read all of the configuration data. */
type AllConfigCmd struct {
	resp chan map[string]interface{}
}

/*AppConfigReadChannel is used to push changes to any subscribers within the application that
 * are dependent on those configurations. */
var AppConfigReadChannel chan *ReadConfigCmd

/*AppConfigWriteChannel is used to push changes to any subscribers within the application that
 * are dependent on those configurations. */
var AppConfigWriteChannel chan *WriteConfigCmd

/*AppConfigAppendChannel is used to append items to list configuration options. */
var AppConfigAppendChannel chan *AppendConfigCmd

/*AppConfigAllChannel is used to get the entire data structure of configuration options. */
var AppConfigAllChannel chan *AllConfigCmd

/*ConfigurationListener listens for configuration changes and updates the global variable.
Serves as a stateless goroutine that is the only source of truth for the configuration data
so that all reads and writes are serialized. This is done because configuration changes
might come from various sources. */
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
		case all := <-AppConfigAllChannel:
			all.resp <- configuration
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
	app := &AppendConfigCmd{
		key:  k,
		val:  v,
		resp: make(chan bool),
	}
	AppConfigAppendChannel <- app
}

/*ReadAllConfig reads all of the global configuration settings. */
func ReadAllConfig() map[string]interface{} {
	all := &AllConfigCmd{
		resp: make(chan map[string]interface{}),
	}
	AppConfigAllChannel <- all
	return <-all.resp
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

/*Database opens the database from the store package. The resultant DB is available
 * via the TracerDB global. */
func Database(db string) {
	/* Create the directory if it doesn't exist. */
	if _, err := os.Stat(filepath.Dir(db)); os.IsNotExist(err) {
		os.Mkdir(filepath.Dir(db), 0755)
	}

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
			ret = fmt.Errorf("wasn't able to delete the database at: %s", DatabaseFile)
		}
	}

	return ret
}
