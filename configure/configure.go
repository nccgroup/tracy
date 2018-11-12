package configure

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	l "log"
	"net/http"
	"net/url"
	"os"
	"os/user"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/log"
)

// Configuration is a struct that holds the configration options for the
// environment. This is a read-only struct and shouldn't be modified at
// runtime.
type Configuration struct {
	TracerStrings            map[string]string `json:TracerStrings`
	ServerWhitelist          []*types.Server
	TracyServer              *types.Server
	AutoLaunch               bool `json:AutoLaunch`
	PublicKeyLocation        string
	PrivateKeyLocation       string
	DebugUI                  bool
	CertCachePath            string
	DatabasePath             string
	TracyPath                string
	Version                  string `json:Version`
	SigningCertificate       *tls.Certificate
	ExternalProxyServer      *url.URL
	LogReusedHTTPConnections bool
	ExternalHostname         string
}

// Current holds all the configuration options for the current environment.
var Current Configuration
var eps string
var configData interface{}

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

	err = json.Unmarshal(content, &configData)
	if err != nil {
		l.Fatalf("Configuration file has a JSON syntax error: %s", err.Error())
	}

	// Set up the command line interface.
	var (
		databaseFileUsage    = "Indicate the file to use for the SQLite3 database. By default, a temporary one is picked."
		databaseFileDefault  = "prod-tracer-db.db"
		certCacheFileUsage   = "Indicate the file to use for the certificate cache file."
		certCacheFileDefault = "certificate-cache.json"
		debugUIUsage         = "Indicate if you'd like the UI to use the non-compiled assets in the case of debugging."
		proxyUsage           = "Indicate if the tracy proxy should have a proxy attached to it (should be specified in the form of <scheme>://<host>:<port>)."
		reuseUsage           = "Indicates tracy will log whenever an HTTP connection is reused."
	)
	// Database file. Allows the user to change the location of the SQLite database file.
	flag.StringVar(&Current.DatabasePath, "database", filepath.Join(tp, databaseFileDefault), databaseFileUsage)
	// Cache file for certificates.
	flag.StringVar(&Current.CertCachePath, "certificate-cache", filepath.Join(tp, certCacheFileDefault), certCacheFileUsage)
	// If you want to use the web UI, but don't want to compile all the assets
	flag.BoolVar(&Current.DebugUI, "debug-ui", false, debugUIUsage)
	// Used to configure an external proxy
	flag.StringVar(&eps, "proxy", "", proxyUsage)
	// Used to show reused HTTP connections.
	flag.BoolVar(&Current.LogReusedHTTPConnections, "http-reuse", false, reuseUsage)
}

// Setup unmarshals the configuration file into valid data structures
// that can be easily digested at runtime.
func Setup() {
	config := configData.(map[string]interface{})
	tracers := config["tracers"].(map[string]interface{})
	Current.TracerStrings = make(map[string]string, len(tracers))
	for k, v := range tracers {
		Current.TracerStrings[k] = v.(string)
	}

	ips := config["server-whitelist"].([]interface{})
	var (
		srv *types.Server
		err error
	)
	sw := make([]*types.Server, len(ips))
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
	Current.TracyServer = srv

	if config["auto-launch"].(string) == "true" {
		Current.AutoLaunch = true
	} else {
		Current.AutoLaunch = false
	}

	Current.PublicKeyLocation = config["public-key-loc"].(string)
	Current.PrivateKeyLocation = config["private-key-loc"].(string)
	Current.Version = config["version"].(string)

	if eps != "" {
		s, err := url.Parse(eps)
		if err != nil {
			l.Fatal("invalid proxy: should be of the form <scheme>://<host>:<port>")
		}

		Current.ExternalProxyServer = s
	}
	Current.ExternalHostname = config["external-hostname"].(string)
}

// ParseServer parses a string of the form <host>:<port> into a
// types.Server object where the <host> is resolved to a set of IP
// addresses.
func ParseServer(hp string) (*types.Server, error) {
	splits := strings.Split(hp, ":")
	var host string
	var port uint
	if len(splits) == 1 {
		host = splits[0]
		port = 80
	} else if len(splits) == 2 {
		p, err := strconv.ParseUint(splits[1], 10, 32)
		if err != nil {
			return nil, err
		}
		port = uint(p)
		host = splits[0]
	} else {
		return nil,
			fmt.Errorf("servers should be in the form of <host>:<port>")
	}

	// Convert localhost stuff into 127.0.0.1
	if host == "localhost" {
		host = "127.0.0.1"
	}

	return &types.Server{Port: port, Hostname: host}, nil
}

var tlsConfig = tls.Config{
	InsecureSkipVerify: true,
}

func checkOrigin(r *http.Request) bool {
	return true
}

// ProxyServer configures the TCP listener based on the user's configuration.
func ProxyServer() (http.Transport, websocket.Upgrader, websocket.Dialer, *sync.Pool, *sync.Pool) {
	t := http.Transport{
		Proxy: http.ProxyURL(Current.ExternalProxyServer),
		// If the scheme is HTTPS, need to the use the tls package to
		// make the dial. We also don't care about insecure connections
		// when using tracy. A lot the apps we are testing use dev or
		// QA environments with self-signed certificates.
		TLSClientConfig:     &tlsConfig,
		MaxIdleConns:        0,
		MaxIdleConnsPerHost: 100,
		IdleConnTimeout:     0,
	}

	// Tie the bufferpools together so we don't get a bunch
	// of extra allocations from all the different ends of
	// the websockets and the HTTP proxy who makes use of it.
	bufp := &sync.Pool{
		New: func() interface{} {
			return new(bytes.Buffer)
		},
	}
	bp := &sync.Pool{
		New: func() interface{} {
			return make([]byte, 1024*4)
		},
	}

	u := websocket.Upgrader{
		ReadBufferSize:  1024 * 4,
		WriteBufferSize: 1024 * 4,
		WriteBufferPool: bp,
		CheckOrigin:     checkOrigin,
	}

	w := websocket.Dialer{
		Proxy: http.ProxyURL(Current.ExternalProxyServer),
		// If the scheme is HTTPS, need to the use the tls package to
		// make the dial. We also don't care about insecure connections
		// when using tracy. A lot the apps we are testing use dev or
		// QA environments with self-signed certificates.
		TLSClientConfig: &tlsConfig,
		ReadBufferSize:  1024 * 4,
		WriteBufferSize: 1024 * 4,
		WriteBufferPool: bp,
	}

	return t, u, w, bp, bufp
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
	if Current.TracyServer.Equal(server) {
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
