package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"tracy/configure"
	"tracy/log"
	"tracy/proxy"
	"tracy/tracer/common"
	"tracy/tracer/rest"
	"tracy/tracer/types"
)

func main() {
	fmt.Printf("Starting:\n")
	fmt.Printf("\tproxy...")
	/* Start the proxy. */
	go func() {
		/* Open a TCP listener. */
		ln := configure.ProxyServer()

		/* Load the configured certificates. */
		cert := configure.Certificates()

		/* Serve it. This will block until the user closes the program. */
		proxy.ListenAndServe(ln, cert)
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
	// Set up the logging based on the user command line flags
	log.Init()
	// Open the database
	if err := store.Open(configure.DatabaseFile); err != nil {
		log.Error.Fatal(err.Error())
	}
	// Initialize the rest routes
	rest.Init()

	//TODO: decide if we want to add labels to the database or just keep in them in a configuration file
	/* Add the configured labels to the database. */
	tracers, err := configure.ReadConfig("tracers")
	if err != nil {
		log.Error.Fatal(err.Error())
	}
	for k, v := range tracers.(map[string]interface{}) {
		label := types.Label{
			Tracer:        types.StringToJSONNullString(k),
			TracerPayload: types.StringToJSONNullString(v.(string)),
		}

		common.AddLabel(label)
	}
}
