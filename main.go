package main

import (
	"crypto/tls"
	"encoding/json"
	"encoding/pem"
	"flag"
	"fmt"
	"io/ioutil"
	_ "net/http/pprof"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"runtime/pprof"
	"strings"

	"github.com/nccgroup/tracy/api/rest"
	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
	"github.com/nccgroup/tracy/proxy"
)

var cpuprofile = flag.String("cpuprofile", "", "write cpu profile to file")

func main() {

	if *cpuprofile != "" {
		defer pprof.StopCPUProfile()
	}
	// Open a TCP listener.
	ln := configure.ProxyServer()
	// Create the proxy
	p := proxy.New(ln)
	// Start the proxy that will run forever
	go p.Accept()

	ps, err := configure.ReadConfig("proxy-server")
	if err != nil {
		log.Error.Fatal(err)
	}
	fmt.Printf("Proxy server:\t%s%s", ps.(string), log.NewLine)

	go func() {
		log.Error.Fatal(rest.RestServer.ListenAndServe())
	}()

	ts, err := configure.ReadConfig("tracer-server")
	if err != nil {
		log.Error.Fatal(err)
	}
	fmt.Printf("Tracer server:\t%s%s", ts.(string), log.NewLine)

	autoLaunch, err := configure.ReadConfig("auto-launch")
	if err != nil {
		log.Error.Fatal(err.Error())
	}

	processAutoLaunch(autoLaunch.(string))

	// Wait for the user to close the program.
	signalChan := make(chan os.Signal, 1)
	cleanupDone := make(chan bool)
	signal.Notify(signalChan, os.Interrupt)
	go func() {
		for _ = range signalChan {
			fmt.Println("Ctrl+C pressed. Shutting down...")
			store.DB.Close()
			cleanupDone <- true
		}
	}()
	<-cleanupDone
}

func init() {
	// Parse the flags. Have to parse them hear since other package
	// initialize command line.
	flag.Parse()

	// Set up the logging based on the user command line flags.
	log.Configure()

	if *cpuprofile != "" {
		f, err := os.Create(*cpuprofile)
		if err != nil {
			log.Error.Fatal(err)
		}
		pprof.StartCPUProfile(f)
	}

	// Open the database.
	if err := store.Open(configure.DatabaseFile, log.Verbose); err != nil {
		log.Error.Fatal(err.Error())
	}

	// Initialize the HTTP routes.
	rest.Configure()

	// Instantiate the certificate cache.
	certsJSON, err := ioutil.ReadFile(configure.CertCacheFile)
	if err != nil {
		certsJSON = []byte("[]")
		// Can recover from this. Simply make a cache file and
		// instantiate an empty cache.
		ioutil.WriteFile(configure.CertCacheFile, certsJSON, os.ModePerm)
	}

	var certs []proxy.CertCacheEntry
	if err := json.Unmarshal(certsJSON, &certs); err != nil {
		log.Error.Print(err)
		return
	}

	cache := make(map[string]tls.Certificate)
	for _, cert := range certs {
		keyPEM := cert.Certs.KeyPEM
		certPEM := cert.Certs.CertPEM

		cachedCert, err := tls.X509KeyPair(
			pem.EncodeToMemory(&pem.Block{
				Type:  "CERTIFICATE",
				Bytes: certPEM}),
			pem.EncodeToMemory(&pem.Block{
				Type:  "EC PRIVATE KEY",
				Bytes: keyPEM}))

		if err != nil {
			log.Error.Println(err)
			continue
		}

		cache[cert.Host] = cachedCert
	}
	proxy.SetCertCache(cache)
	configure.Certificates()
}

// processAutoLaunch launchs whatever browser they have configured.
func processAutoLaunch(option string) {
	switch option {
	case "default":
		s, err := configure.ReadConfig("tracer-server")
		if err != nil {
			log.Error.Print(err)
		}
		openbrowser(fmt.Sprintf("http://%s", s))
	case "off":
		return
	default:
		var cmd *exec.Cmd
		optionArray := strings.Split(option, " ")
		if len(optionArray) == 1 {
			cmd = exec.Command(optionArray[0])
		} else if len(optionArray) > 1 {
			cmd = exec.Command(optionArray[0], optionArray[1:]...)
		} else {
			return
		}
		cmd.Run()
	}
}

// openBrowser opens the default browser the user has configured.
// Taken from here https://gist.github.com/hyg/9c4afcd91fe24316cbf0
func openbrowser(url string) {
	var err error

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		err = fmt.Errorf("unsupported platform")
	}

	if err != nil {
		log.Error.Print(err)
	}
}
