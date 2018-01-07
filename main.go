package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"xxterminator-plugin/configure"
	"xxterminator-plugin/log"
	"xxterminator-plugin/proxy"
	"xxterminator-plugin/tracer/common"
	"xxterminator-plugin/tracer/types"
)

func main() {
	fmt.Printf("Starting...")
	/* Start the proxy. */
	go func() {
		/* Open a TCP listener. */
		ln := configure.ProxyServer()

		/* Load the configured certificates. */
		cert := configure.Certificates()

		/* Serve it. This will block until the user closes the program. */
		proxy.ListenAndServe(ln, cert)
	}()
	fmt.Printf("proxy,")

	/* Serve it. Block here so the program doesn't close. */
	go func() {
		/* Configure and start the server, but we won't need the router. */
		srv, _ := configure.Server()
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
			cleanupDone <- true
		}
	}()
	<-cleanupDone
}

func init() {
	// Parse the flags. Have to parse them hear since other package initialize command line
	flag.Parse()
	log.Init()
	configure.Database(configure.DatabaseFile)

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
		_, _ = common.AddLabel(label)
	}
}
