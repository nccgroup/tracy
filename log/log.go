package log

import (
	"flag"
	"io"
	"log"
	"os"
)

var (
	/*Trace is used for logging trivial things to the command line. Only print in verbose mode. */
	Trace logger
	/*Info is used for logging more detailed program data. Only display this in verbose mode. */
	Info logger
	/*Warning is used for logging errors and exceptions that do not halt program flow. Only display in verbose mode. */
	Warning logger
	/*Error is used for logging program errors that cannot recover. */
	Error logger
	/*Verbose indicate if the program is in verbose mode and should prints more detailed error messages during the program runtime. */
	Verbose bool
	/* Output file. Moves stdout and stderr to a file on disk. */
	outFile        string
	outFileDefault = "empty"
)

/* Configure flags the logging format. */
const flags int = log.Ldate | log.Ltime | log.Lshortfile
const traceStr string = "[TRACE]:"
const infoStr string = "[INFO]:"
const warnStr string = "[WARNING]:"
const errorStr string = "[ERROR]:"

func init() {
	verboseUsage := "Indicate if you'd like to run this tool with advanced debugging logs."
	outputFileUsage := "Indicate an external file all logs should be written to."

	//Set up the command line interface.
	flag.BoolVar(&Verbose, "verbose", false, verboseUsage)
	flag.BoolVar(&Verbose, "v", false, verboseUsage+"(shorthand)")

	flag.StringVar(&outFile, "outfile", outFileDefault, outputFileUsage)
	flag.StringVar(&outFile, "o", outFileDefault, outputFileUsage+"(shorthand)")

	/* Defaults for tests. */
	Trace = log.New(os.Stdout, traceStr, flags)
	Info = log.New(os.Stdout, infoStr, flags)
	Warning = log.New(os.Stdout, warnStr, flags)
	Error = log.New(os.Stderr, errorStr, flags)
}

/*Configure takes the command line options and builds the loggers. */
func Configure() {
	if outFile != outFileDefault {
		/* If they specified an output file, initialize the loggers to use that file. */
		file, err := os.OpenFile(outFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0600)
		if err != nil {
			/* Since we haven't initialized the logger yet, have to use the standard libraries. Fail fast here. */
			log.Fatal(err)
		}

		if Verbose {
			/* If they pick verbose mode, redirect all the loggers to the desired output file. */
			Trace = log.New(file, traceStr, flags)
			Info = log.New(file, infoStr, flags)
			Warning = log.New(file, warnStr, flags)
			Error = log.New(file, errorStr, flags)
		} else {
			/* Otherwise, discard the more verbose output. */
			Trace = &NopLogger{}
			Info = &NopLogger{}
			Warning = &NopLogger{}
			Error = log.New(file, errorStr, flags)
		}
	} else {
		/* Otherwise, initialize the logger to use stdout and stderr. */
		if Verbose {
			Trace = log.New(os.Stdout, traceStr, flags)
			Info = log.New(os.Stdout, infoStr, flags)
			Warning = log.New(os.Stdout, warnStr, flags)
			Error = log.New(os.Stderr, errorStr, flags)
		} else {
			Trace = &NopLogger{}
			Info = &NopLogger{}
			Warning = &NopLogger{}
			Error = log.New(os.Stderr, errorStr, flags)
		}
	}
}

/* Interface that wraps the log.Logger struct so we can implement a custom nop Logger. */
type logger interface {
	Fatal(v ...interface{})
	Fatalf(format string, v ...interface{})
	Fatalln(v ...interface{})
	Flags() int
	Output(calldepth int, s string) error
	Panic(v ...interface{})
	Panicf(format string, v ...interface{})
	Panicln(v ...interface{})
	Prefix() string
	Print(v ...interface{})
	Printf(format string, v ...interface{})
	Println(v ...interface{})
	SetFlags(flag int)
	SetOutput(w io.Writer)
	SetPrefix(prefix string)
}

/*NopLogger implement log.Logger, but does nothing. This logger is used by default when verbose mode is turned off. */
type NopLogger struct {
}

/*Fatal does nothing. */
func (l *NopLogger) Fatal(v ...interface{}) {
	// noop
}

/*Fatalf does nothing. */
func (l *NopLogger) Fatalf(format string, v ...interface{}) {
	// noop
}

/*Fatalln does nothing. */
func (l *NopLogger) Fatalln(v ...interface{}) {
	// noop
}

/*Flags returns 0. */
func (l *NopLogger) Flags() int {
	// noop
	return 0
}

/*Output returns nil. */
func (l *NopLogger) Output(calldepth int, s string) error {
	// noop
	return nil
}

/*Panic does nothing. */
func (l *NopLogger) Panic(v ...interface{}) {
	// noop
}

/*Panicf does nothing. */
func (l *NopLogger) Panicf(format string, v ...interface{}) {
	// noop
}

/*Panicln does nothing. */
func (l *NopLogger) Panicln(v ...interface{}) {
	// noop
}

/*Prefix returns an empty string. */
func (l *NopLogger) Prefix() string {
	// noop
	return ""
}

/*Print does nothing. */
func (l *NopLogger) Print(v ...interface{}) {
	// noop
}

/*Printf does nothing. */
func (l *NopLogger) Printf(format string, v ...interface{}) {
	// noop
}

/*Println does nothing. */
func (l *NopLogger) Println(v ...interface{}) {
	// noop
}

/*SetFlags does nothing. */
func (l *NopLogger) SetFlags(flag int) {
	// noop
}

/*SetOutput does nothing. */
func (l *NopLogger) SetOutput(w io.Writer) {
	// noop
}

/*SetPrefix does nothing. */
func (l *NopLogger) SetPrefix(prefix string) {
	// noop
}
