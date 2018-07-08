package log

import "io"

// Interface that wraps the log.Logger struct so we can implement a custom nop
// Logger.
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

// NopLogger implement log.Logger, but does nothing. This logger is used by
// default when verbose mode is turned off.
type NopLogger struct {
}

/*Fatal does nothing. */
func (l *NopLogger) Fatal(v ...interface{}) {
	// noop
}

// Fatalf does nothing.
func (l *NopLogger) Fatalf(format string, v ...interface{}) {
	// noop
}

// Fatalln does nothing.
func (l *NopLogger) Fatalln(v ...interface{}) {
	// noop
}

// Flags returns 0.
func (l *NopLogger) Flags() int {
	// noop
	return 0
}

// Output returns nil.
func (l *NopLogger) Output(calldepth int, s string) error {
	// noop
	return nil
}

// Panic does nothing.
func (l *NopLogger) Panic(v ...interface{}) {
	// noop
}

// Panicf does nothing.
func (l *NopLogger) Panicf(format string, v ...interface{}) {
	// noop
}

// Panicln does nothing.
func (l *NopLogger) Panicln(v ...interface{}) {
	// noop
}

// Prefix returns an empty string.
func (l *NopLogger) Prefix() string {
	// noop
	return ""
}

// Print does nothing.
func (l *NopLogger) Print(v ...interface{}) {
	// noop
}

// Printf does nothing.
func (l *NopLogger) Printf(format string, v ...interface{}) {
	// noop
}

// Println does nothing.
func (l *NopLogger) Println(v ...interface{}) {
	// noop
}

// SetFlags does nothing.
func (l *NopLogger) SetFlags(flag int) {
	// noop
}

// SetOutput does nothing
func (l *NopLogger) SetOutput(w io.Writer) {
	// noop
}

// SetPrefix does nothing.
func (l *NopLogger) SetPrefix(prefix string) {
	// noop
}
