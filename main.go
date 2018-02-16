package main

import (
	"crypto/tls"
	"encoding/json"
	"encoding/pem"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"runtime/pprof"
	"tracy/api/common"
	"tracy/api/rest"
	"tracy/api/store"
	"tracy/api/types"
	"tracy/configure"
	"tracy/log"
	"tracy/proxy"
)

var cpuprofile = flag.String("cpuprofile", "", "write cpu profile to file")

func main() {
	if *cpuprofile != "" {
		defer pprof.StopCPUProfile()
	}

	fmt.Printf("Starting:\n")
	fmt.Printf("\tproxy...")
	/* Start the proxy. */
	go func() {
		/* Open a TCP listener. */
		ln := configure.ProxyServer()

		/* TODO: move to the init stuff, this isn't really a configuration. Load the configured certificates. */
		configure.Certificates()

		/* Serve it. This will block until the user closes the program. */
		proxy.ListenAndServe(ln)
	}()
	fmt.Printf("done.\n")

	fmt.Printf("\tconfig server...")
	/* Serve it. Block here so the program doesn't close. */
	go func() {
		log.Error.Fatal(rest.ConfigServer.ListenAndServe())
	}()
	fmt.Printf("done.\n")

	fmt.Printf("\ttracer server...")
	/* Serve it. Block here so the program doesn't close. */
	go func() {
		log.Error.Fatal(rest.RestServer.ListenAndServe())
	}()
	fmt.Printf("done!\n")

	//openbrowser("http://localhost:8081")

	/* Waiting for the user to close the program. */
	signalChan := make(chan os.Signal, 1)
	cleanupDone := make(chan bool)
	signal.Notify(signalChan, os.Interrupt)
	go func() {
		for _ = range signalChan {
			fmt.Println("Ctrl+C pressed. Shutting down...")
			cleanupDone <- true
		}
	}()
	<-cleanupDone
}

func init() {
	// Parse the flags. Have to parse them hear since other package initialize command line
	flag.Parse()

	if *cpuprofile != "" {
		f, err := os.Create(*cpuprofile)
		if err != nil {
			panic(err)
		}
		pprof.StartCPUProfile(f)
	}

	// Set up the logging based on the user command line flags
	log.Configure()
	// Open the database
	if err := store.Open(configure.DatabaseFile, log.Verbose); err != nil {
		log.Error.Fatal(err.Error())
	}

	// Initialize the rest routes
	rest.Configure()

	//TODO: decide if we want to add labels to the database or just keep in them in a configuration file
	/* Add the configured labels to the database. */
	tracers, err := configure.ReadConfig("tracers")
	if err != nil {
		log.Error.Fatal(err.Error())
	}
	for k, v := range tracers.(map[string]interface{}) {
		label := types.Label{
			TracerString:  k,
			TracerPayload: v.(string),
		}

		common.AddLabel(label)
	}

	// Instantiate the certificate cache
	certsJSON, err := ioutil.ReadFile(configure.CertCacheFile)
	if err != nil {
		certsJSON = []byte("[]")
		// Can recover from this. Simply make a cache file and instantiate an empty cache.
		ioutil.WriteFile(configure.CertCacheFile, certsJSON, os.ModePerm)
	}

	certs := []proxy.CertCacheEntry{}
	if err := json.Unmarshal(certsJSON, &certs); err == nil {
		cache := make(map[string]tls.Certificate)
		for _, cert := range certs {
			keyPEM := cert.Certs.KeyPEM
			certPEM := cert.Certs.CertPEM

			cachedCert, err := tls.X509KeyPair(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certPEM}), pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyPEM}))
			if err != nil {
				log.Error.Println(err)
			}

			cache[cert.Host] = cachedCert
		}

		proxy.SetCertCache(cache)
	} else {
		log.Error.Println(err)
		log.Error.Println(string(certsJSON))
	}
}

//Taken from here https://gist.github.com/hyg/9c4afcd91fe24316cbf0
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
		log.Error.Fatal(err)
	}

}
