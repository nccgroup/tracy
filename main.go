package main

import (
	pc "xxterminator-plugin/proxy/configure"
	"xxterminator-plugin/proxy"
	tc "xxterminator-plugin/tracer/configure"
	"path/filepath"
	"os"
	"flag"
	"xxterminator-plugin/log"
	l "log"
	"io/ioutil"
	"runtime/pprof"
	"os/signal"
	"fmt"
)

var cpuprofile = flag.String("cpuprofile", "", "write cpu profile to file")

func main() {
	fmt.Printf("Starting...")
	if *cpuprofile != "" {
		f, err := os.Create(*cpuprofile)
		if err != nil {
			l.Fatal(err)
		}
		pprof.StartCPUProfile(f)
	}

	/* Start the proxy. */
	go func() {
		/* Open a TCP listener. */
		ln := pc.ProxyServer()

		/* Load the configured certificates. */
		cert := pc.Certificates()

		/* Serve it. This will block until the user closes the program. */
		proxy.ListenAndServe(ln, cert)
	}()
	fmt.Printf("proxy,")

	/* Serve it. Block here so the program doesn't close. */
	go func() {
		/* Configure and start the server, but we won't need the router. */
		srv, _ := tc.Server()
		log.Error.Fatal(srv.ListenAndServe())
	}()
	fmt.Printf("tracer server. done!\n")

	/* Waiting for the user to close the program. */
	signalChan := make(chan os.Signal, 1)
	cleanupDone := make(chan bool)
	signal.Notify(signalChan, os.Interrupt)
	go func() {
		for _ = range signalChan {
			fmt.Println("Received an interrupt, stopping services...")
			if *cpuprofile != "" {
				pprof.StopCPUProfile()
			}
			cleanupDone <- true
		}
	}()
	<-cleanupDone
}

func init() {
	/* Set up the command line interface. */
	const (
		verboseUsage       = "Indicate if you'd like to run this tool with advanced debugging logs."
		outputFileUsage = "Indicate an external file all logs should be written to."
	)
	var verbose bool
	var outFile string
	flag.BoolVar(&verbose, "verbose", false, verboseUsage)
	flag.BoolVar(&verbose, "v", false, verboseUsage + "(shorthand)")
	flag.StringVar(&outFile, "outfile", "empty", outputFileUsage)
	flag.StringVar(&outFile, "o", "empty", outputFileUsage + "(shorthand)")

	// Parse the flags.
	flag.Parse()

	/* Configure the logging settings. */
	if outFile != "empty" {
		/* If they specified an output file, initialize the loggers to use that file. */
		file, err := os.OpenFile(outFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			l.Fatalln("Failed to open log file", outFile, ":", err)
		}
		if verbose {
			log.Init(file, file, file, file)
		} else {
			log.Init(ioutil.Discard, ioutil.Discard, ioutil.Discard, file)
		}
	} else {
		/* Otherwise, initialize the logger to use stdout and stderr. */
		if verbose {
			log.Init(os.Stdout, os.Stdout, os.Stdout, os.Stderr)
		} else {
			log.Init(ioutil.Discard, ioutil.Discard, ioutil.Discard, os.Stderr)
		}
	}

	/* Indicate that this is the prod database and not the test. */
	db := filepath.Join(os.TempDir(), "prod")
	/* Create the directory if it doesn't exist. */
	if _, err := os.Stat(db); os.IsNotExist(err) {
		os.Mkdir(db, 0755)
	}
	tc.Database(filepath.Join(db, "tracer-db.db"))
}
