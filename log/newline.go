package log

import (
	"runtime"
)

/*CachedNewLine is newline to use in log messages for the OS of choice. */
var cachedNewLine string

/*NewLine returns a string representing the new line for the specific OS. */
func NewLine() string {
	if cachedNewLine == "" {
		switch runtime.GOOS {
		case "linux", "darwin":
			return "\n"
		case "windows":
			return "\r\n"
		default:
			return "\n"
		}
	} else {
		return cachedNewLine
	}
}
