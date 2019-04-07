package main

import (
	"flag"
	"fmt"
	_ "net/http/pprof"
	"os"
	"os/signal"
	"runtime/pprof"

	"github.com/nccgroup/tracy/api/rest"
	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
)

var cpuprofile = flag.String("cpuprofile", "", "write cpu profile to file")

func main() {
	if *cpuprofile != "" {
		defer pprof.StopCPUProfile()
	}

	go func() {
		log.Error.Fatal(rest.Server.ListenAndServe())
	}()

	fmt.Printf("Tracer server:\t%s%s",
		configure.Current.TracyServer.Addr(), log.NewLine)

	// Wait for the user to close the program.
	signalChan := make(chan os.Signal, 1)
	cleanupDone := make(chan bool)
	signal.Notify(signalChan, os.Interrupt)
	go func() {
		for range signalChan {
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

	// Set up the configuration.
	configure.Setup()

	if *cpuprofile != "" {
		f, err := os.Create(*cpuprofile)
		if err != nil {
			log.Error.Fatal(err)
		}
		pprof.StartCPUProfile(f)
	}

	// Open the database.
	if err := store.Open(configure.Current.DatabasePath, log.Verbose); err != nil {
		log.Error.Fatal(err.Error())
	}

	// Initialize the HTTP routes.
	rest.Configure(rest.API_ONLY)

}
