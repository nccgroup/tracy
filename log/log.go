package log

import (
	"io"
	"log"
)

/*Debug holds the logging state of the application. */
var Debug = false
var Outfile = ""

var (
	/*Trace is used for logging trivial things to the command line. Only print in verbose mode. */
	Trace *log.Logger
	/*Info is used for logging more detailed program data. Only display this in verbose mode. */
	Info *log.Logger
	/*Warning is used for logging errors and exceptions that do not halt program flow. Only display in verbose mode. */
	Warning *log.Logger
	/*Error is used for logging program errors that cannot recover. */
	Error *log.Logger
)

func Init(traceHandle io.Writer, infoHandle io.Writer, warningHandle io.Writer, errorHandle io.Writer) {
	Trace = log.New(traceHandle,
		"[TRACE]: ",
		log.Ldate|log.Ltime|log.Lshortfile)

	Info = log.New(infoHandle,
		"[INFO]: ",
		log.Ldate|log.Ltime|log.Lshortfile)

	Warning = log.New(warningHandle,
		"[WARNING]: ",
		log.Ldate|log.Ltime|log.Lshortfile)

	Error = log.New(errorHandle,
		"[ERROR]: ",
		log.Ldate|log.Ltime|log.Lshortfile)
}
