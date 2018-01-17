package log

import (
	"flag"
	"io"
	"io/ioutil"
	"log"
	"os"
)

var (
	/*Trace is used for logging trivial things to the command line. Only print in verbose mode. */
	Trace *log.Logger
	/*Info is used for logging more detailed program data. Only display this in verbose mode. */
	Info *log.Logger
	/*Warning is used for logging errors and exceptions that do not halt program flow. Only display in verbose mode. */
	Warning *log.Logger
	/*Error is used for logging program errors that cannot recover. */
	Error *log.Logger
	/*Verbose indicate if the program is in verbose mode and should prints more detailed error messages during the program runtime. */
	Verbose bool
	/* Output file. Moves stdout and stderr to a file on disk. */
	outFile        string
	outFileDefault = "empty"
)

func init() {
	verboseUsage := "Indicate if you'd like to run this tool with advanced debugging logs."
	outputFileUsage := "Indicate an external file all logs should be written to."

	//Set up the command line interface.
	flag.BoolVar(&Verbose, "verbose", false, verboseUsage)
	flag.BoolVar(&Verbose, "v", false, verboseUsage+"(shorthand)")

	flag.StringVar(&outFile, "outfile", outFileDefault, outputFileUsage)
	flag.StringVar(&outFile, "o", outFileDefault, outputFileUsage+"(shorthand)")
}

/*Init takes the command line options and builds the loggers. */
func Init() {
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
			log.Fatal(err)
		}

		if Verbose {
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
		if Verbose {
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

	Trace = log.New(traceWriter,
		"[TRACE]: ",
		log.Ldate|log.Ltime|log.Lshortfile)

	Info = log.New(infoWriter,
		"[INFO]: ",
		log.Ldate|log.Ltime|log.Lshortfile)

	Warning = log.New(warningWriter,
		"[WARNING]: ",
		log.Ldate|log.Ltime|log.Lshortfile)

	Error = log.New(errorWriter,
		"[ERROR]: ",
		log.Ldate|log.Ltime|log.Lshortfile)
}
