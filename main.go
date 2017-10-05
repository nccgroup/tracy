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
)

func main() {
	/* Start the proxy. */
	go func() {
		/* Open a TCP listener. */
		ln := pc.ProxyServer()

		/* Load the configured certificates. */
		cert := pc.Certificates()

		/* Serve it. This will block until the user closes the program. */
		proxy.ListenAndServe(ln, cert)
	}()

	/* Configure and start the server, but we won't need the router. */
	srv, _ := tc.Server()

	/* Serve it. Block here so the program doesn't close. */
	log.Error.Fatal(srv.ListenAndServe())
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
