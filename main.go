package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	l "log"
	"os"
	"os/signal"
	"path/filepath"
	"runtime/pprof"
	"xxterminator-plugin/log"
	"xxterminator-plugin/proxy"
	pc "xxterminator-plugin/proxy/configure"
	tc "xxterminator-plugin/tracer/configure"
	"io"
)

func main() {
	fmt.Printf("Starting...")
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
			fmt.Println("Ctrl+C pressed. Shutting down...")
			pprof.StopCPUProfile()
			cleanupDone <- true
		}
	}()
	<-cleanupDone
}

func init() {
	/* Set up the command line interface. */
	const (
		verboseUsage    = "Indicate if you'd like to run this tool with advanced debugging logs."
		outputFileUsage = "Indicate an external file all logs should be written to."
		outFileDefault = "empty"
		databaseFileUsage = "Indicate the file to use for the SQLite3 database. By default, a temporary one is picked."
		databaseFileDefault = "/prod/tracer-db.db"
		cpuProfileFileUsage = "Indicate the file to store the CPU profile in."
		cpuProfileFileDefault = "empty"

	)

	/* Verbose mode. Prints more detailed error messages during the program runtime. */
	var verbose bool
	flag.BoolVar(&verbose, "verbose", false, verboseUsage)
	flag.BoolVar(&verbose, "v", false, verboseUsage + "(shorthand)")

	/* Output file. Moves stdout and stderr to a file on disk. */
	var outFile string
	flag.StringVar(&outFile, "outfile", outFileDefault, outputFileUsage)
	flag.StringVar(&outFile, "o", outFileDefault, outputFileUsage + "(shorthand)")

	/* Database file. Allows the user to change the location of the SQLite database file. */
	var databaseFile string
	flag.StringVar(&databaseFile, "database", os.TempDir() + databaseFileDefault, databaseFileUsage)
	flag.StringVar(&databaseFile, "d", os.TempDir() + databaseFileDefault, databaseFileUsage + "(shorthand)")

	/* CPU profile mode. Runs the CPU profiler during program runtime and writes the output to the file specified. */
	var cpuprofile string
	flag.StringVar(&cpuprofile, "cpuprofile", cpuProfileFileDefault, cpuProfileFileUsage)
	flag.StringVar(&cpuprofile, "c", cpuProfileFileDefault, cpuProfileFileUsage + "(shorthand)")

	// Parse the flags.
	flag.Parse()

	/* Configure the logging settings. */
	var traceWriter io.Writer
	var infoWriter io.Writer
	var warningWriter io.Writer
	var errorWriter io.Writer
	if outFile != outFileDefault {
		/* If they specified an output file, initialize the loggers to use that file. */
		file, err := os.OpenFile(outFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0600)
		if err != nil {
			/* Since we haven't initialized the logger yet, have to use the standard libraries. Fail fast here. */
			l.Fatal(err)
		}

		if verbose {
			/* If they pick verbose mode, redirect all the loggers to the desired output file. */
			traceWriter = file
			infoWriter = file
			warningWriter = file
			errorWriter = file
		} else {
			/* Otherwise, discard the more verbose output. */
			traceWriter = ioutil.Discard
			infoWriter = ioutil.Discard
			warningWriter = ioutil.Discard
			errorWriter = file
		}
	} else {
		/* Otherwise, initialize the logger to use stdout and stderr. */
		if verbose {
			traceWriter = os.Stdout
			infoWriter = os.Stdout
			warningWriter = os.Stdout
			errorWriter = os.Stderr
		} else {
			traceWriter = ioutil.Discard
			infoWriter = ioutil.Discard
			warningWriter = ioutil.Discard
			errorWriter = os.Stderr
		}
	}
	log.Init(traceWriter, infoWriter, warningWriter, errorWriter)

	/* Create the directory if it doesn't exist. */
	if _, err := os.Stat(filepath.Dir(databaseFile)); os.IsNotExist(err) {
		os.Mkdir(filepath.Dir(databaseFile), 0600)
	}
	tc.Database(databaseFile)

	/* Configure the CPU profiler if one was configured. */
	if cpuprofile != cpuProfileFileDefault {
		/* Create the directory if it doesn't exist. */
		if _, err := os.Stat(filepath.Dir(cpuprofile)); os.IsNotExist(err) {
			os.Mkdir(filepath.Dir(cpuprofile), 0600)
		}
		f, err := os.Create(cpuprofile)
		if err != nil {
			l.Fatal(err)
		}
		/* Start profiling. */
		pprof.StartCPUProfile(f)
	}
}
