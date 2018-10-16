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
	"strconv"
	"strings"

	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/log"
)

// Current holds all the configuration options for the current environment.
var Current types.Configuration

func init() {
	usr, err := user.Current()
	if err != nil {
		l.Fatal(err)
	}

	tp := filepath.Join(usr.HomeDir, ".tracy")
	if _, err = os.Stat(tp); os.IsNotExist(err) {
		os.Mkdir(tp, 0755)
	}

	// Write the server certificates.
	pubKeyPath := filepath.Join(tp, "cert.pem")
	if _, err = os.Stat(pubKeyPath); os.IsNotExist(err) {
		generateRootCA(tp)
	}
	privKeyPath := filepath.Join(tp, "key.pem")
	if _, err = os.Stat(privKeyPath); os.IsNotExist(err) {
		generateRootCA(tp)
	}

	// Read the configuration.
	configPath := filepath.Join(tp, "tracy.json")
	var content []byte
	if _, err = os.Stat(configPath); os.IsNotExist(err) {
		// Try to recover by writing a new tracer.json file with the
		// default values.
		pubKeyPath = strings.Replace(pubKeyPath, "\\", "\\\\", -1)
		privKeyPath = strings.Replace(privKeyPath, "\\", "\\\\", -1)
		def := fmt.Sprintf(DefaultConfig, pubKeyPath, privKeyPath)
		// Make sure to escape the path variables in windows paths.
		ioutil.WriteFile(configPath, []byte(def), 0755)
		content = []byte(def)
	} else {
		content, err = ioutil.ReadFile(configPath)
		if err != nil {
			l.Fatal(err)
		}
	}
	Current.TracyPath = tp
	var configData interface{}
	err = json.Unmarshal(content, &configData)
	if err != nil {
		l.Fatalf("Configuration file has a JSON syntax error: %s", err.Error())
	}
	SetupConfig(configData.(map[string]interface{}))

	// Set up the command line interface.
	var (
		databaseFileUsage    = "Indicate the file to use for the SQLite3 database. By default, a temporary one is picked."
		databaseFileDefault  = "prod-tracer-db.db"
		certCacheFileUsage   = "Indicate the file to use for the certificate cache file."
		certCacheFileDefault = "certificate-cache.json"
		debugUIUsage         = "Indicate if you'd like the UI to use the non-compiled assets in the case of debugging."
	)
	// Database file. Allows the user to change the location of the SQLite database file.
	flag.StringVar(&Current.DatabasePath, "database", filepath.Join(tp, databaseFileDefault), databaseFileUsage)
	// Cache file for certificates.
	flag.StringVar(&Current.CertCachePath, "certificate-cache", filepath.Join(tp, certCacheFileDefault), certCacheFileUsage)
	// If you want to use the web UI, but don't want to compile all the assets
	flag.BoolVar(&Current.DebugUI, "debug-ui", false, debugUIUsage)
}

// SetupConfig Unmarshals the configuration file into valid data structures
// that can be easily digested at runtime.
func SetupConfig(config map[string]interface{}) {
	tracers := config["tracers"].(map[string]interface{})
	Current.TracerStrings = make(map[string]string, len(tracers))
	for k, v := range tracers {
		Current.TracerStrings[k] = v.(string)
	}

	ips := config["server-whitelist"].([]interface{})
	var (
		srv types.Server
		err error
	)
	sw := make([]types.Server, len(ips))
	for i, ip := range ips {
		srv, err = ParseServer(ip.(string))
		if err != nil {
			l.Fatal(err)
		}
		sw[i] = srv
	}
	Current.ServerWhitelist = sw

	srv, err = ParseServer(config["tracer-server"].(string))
	if err != nil {
		l.Fatal("configuration invalid ", err)
	}
	Current.TracerServer = srv

	srv, err = ParseServer(config["proxy-server"].(string))
	if err != nil {
		l.Fatal("configuration invalid: ", err)
	}
	Current.ProxyServer = srv

	if config["auto-launch"].(string) == "true" {
		Current.AutoLaunch = true
	} else {
		Current.AutoLaunch = false
	}

	Current.PublicKeyLocation = config["public-key-loc"].(string)
	Current.PrivateKeyLocation = config["private-key-loc"].(string)
	Current.Version = config["version"].(string)
}

// ParseServer parses a string of the form <host>:<port> into a
// types.Server object where the <host> is resolved to a set of IP
// addresses.
func ParseServer(hp string) (types.Server, error) {
	splits := strings.Split(hp, ":")
	if len(splits) != 2 {
		return types.Server{},
			fmt.Errorf("servers should be in the form of <host>:<port>")
	}

	u, err := net.LookupIP(splits[0])
	if err != nil {
		return types.Server{}, err
	}

	if len(u) <= 0 {
		fmt.Errorf("no hosts resolved in origin check")
	}

	p, err := strconv.ParseUint(splits[1], 10, 32)
	if err != nil {
		return types.Server{}, err
	}

	return types.Server{IPs: u, Port: uint(p), Hostname: splits[0]}, nil
}

// ProxyServer configures the TCP listener based on the user's configuration.
func ProxyServer() net.Listener {
	s := fmt.Sprintf("%s:%d",
		Current.ProxyServer.IPs[0].String(),
		Current.ProxyServer.Port)
	ret, err := net.Listen("tcp", s)
	if err != nil {
		/* Cannot continue if the application doesn't have TCP listener. Fail fast. */
		log.Error.Fatalf("Cannot listen on %s: %+v", s, err)
	}

	return ret
}

// HostInWhitelist returns true if the host is in the whitelist of the
// configuration file or is the tracy server.Used to block the development
// servers.
func HostInWhitelist(host string) bool {
	server, err := ParseServer(host)
	if err != nil {
		log.Error.Printf("%s: got %s", err, host)
		return false
	}

	for _, v := range Current.ServerWhitelist {
		if v.Equal(server) {
			return true
		}
	}

	// Automatically whitelist the configured tracer server.
	if Current.TracerServer.Equal(server) {
		return true
	}

	return false
}

// DeleteDatabase deletes the database at the file path specified.
func DeleteDatabase(db string) error {
	// If the database exists, remove it.
	if _, err := os.Stat(db); !os.IsNotExist(err) {
		err := os.Remove(db)
		if err != nil {
			return fmt.Errorf("wasn't able to delete the database at: %s", db)
		}
	}

	return nil
}
