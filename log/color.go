package log

import (
	"github.com/fatih/color"
)

// Helper function to uniform our print statements to the user.
const formatTemplate = "[*] %s"

func fPrint(message string, col color.Attribute) {
	color.New(col).Printf(formatTemplate, message)
}

func PrintRed(message string) {
	fPrint(message, color.FgRed)
}

func PrintGreen(message string) {
	fPrint(message, color.FgGreen)
}

func PrintCyan(message string) {
	fPrint(message, color.FgCyan)
}
