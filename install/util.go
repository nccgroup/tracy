package install

import (
	"bufio"
	"os"
	"tracy/log"
)

//Helper function to get the standard input from the user
func Input(message string) string {
	reader := bufio.NewReader(os.Stdin)
	log.PrintGreen(message)
	answer, err := reader.ReadString('\n')
	if err != nil {
		log.Error.Fatal(err)
	}

	return answer
}
