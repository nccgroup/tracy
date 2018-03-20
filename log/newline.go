package log

import (
	"runtime"
)

var CachedNewLine string

func NewLine() string {
	if CachedNewLine == "" {
		switch runtime.GOOS {
		case "linux", "darwin":
			return "\n"
		case "windows":
			return "\r\n"
		default:
			return "\n"
		}
	} else {
		return CachedNewLine
	}
}
