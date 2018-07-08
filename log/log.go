package log

import (
	"flag"
	"log"
	"os"
	"runtime"
)

var (
	// Trace is used for logging trivial things to the command line. Only
	// print in verbose mode.
	Trace *log.Logger
	// Info is used for logging more detailed program data. Only print in
	// verbose mode.
	Info *log.Logger
	// Warning is used for logging errors and exceptions that do not halt
	// program flow. Only display in verbose mode.
	Warning *log.Logger
	// Error is used for logging program errors that cannot recover and the
	// user should know about. Always display.
	Error *log.Logger
	// Verbose indicates if the program is in verbose mode.
	Verbose bool
	// NewLine is newline to use in log messages for the OS of choice.
	NewLine string
	// Output file. Moves stdout and stderr to a file on disk.
	outFile        string
	outFileDefault = "empty"
)

// String formatting constants for logging.
const flags int = log.Ldate | log.Ltime | log.Lshortfile
const traceStr string = "[TRACE]:"
const infoStr string = "[INFO]:"
const warnStr string = "[WARNING]:"
const errorStr string = "[ERROR]:"

func init() {
	verboseUsage := "Indicate if you'd like to run this tool with advanced debugging logs."
	flag.BoolVar(&Verbose, "verbose", false, verboseUsage)
	flag.BoolVar(&Verbose, "v", false, verboseUsage+"(shorthand)")

	outputFileUsage := "Indicate an external file all logs should be written to."
	flag.StringVar(&outFile, "outfile", outFileDefault, outputFileUsage)
	flag.StringVar(&outFile, "o", outFileDefault, outputFileUsage+"(shorthand)")

	// Defaults loggers only print errors. This is very helpful when
	// running tests.
	nopW := noopWriter{}
	Trace = &log.Logger{}
	Trace.SetOutput(nopW)
	Info = &log.Logger{}
	Info.SetOutput(nopW)
	Warning = &log.Logger{}
	Warning.SetOutput(nopW)
	Error = log.New(os.Stderr, errorStr, flags)

	switch runtime.GOOS {
	case "linux", "darwin":
		NewLine = "\n"
	case "windows":
		NewLine = "\r\n"
	default:
		NewLine = "\n"
	}
}

type noopWriter struct {
}

func (a noopWriter) Write(p []byte) (n int, err error) {
	return len(p), nil
}

// Configure takes the command line options and builds the loggers.
func Configure() {
	if Verbose {
		Trace = log.New(os.Stdout, traceStr, flags)
		Info = log.New(os.Stdout, infoStr, flags)
		Warning = log.New(os.Stdout, warnStr, flags)
		Error = log.New(os.Stderr, errorStr, flags)
	}

	if outFile != outFileDefault {
		// If they specified an output file, initialize the loggers to
		// use that file.
		file, err := os.OpenFile(outFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0600)
		if err != nil {
			Error.Print(err)
			return
		}

		if Verbose {
			// If they pick verbose mode, redirect all the loggers
			// to the desired output file.
			Trace = log.New(file, traceStr, flags)
			Info = log.New(file, infoStr, flags)
			Warning = log.New(file, warnStr, flags)
			Error = log.New(file, errorStr, flags)
		}
	}
}
