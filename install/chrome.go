package install

import (
	"fmt"
	"os/user"
	"runtime"
	"tracy/log"
)

//TODO: might not be doable. might have to provide a link they click or something?
func Chrome() string {
	user, err := user.Current()
	if err != nil {
		log.Error.Fatal(err)
	}

	const dPath = `~/Library/Application Support/Mozilla/Extensions/tracyplugin@tracy.com/`
	wPath := fmt.Sprintf(`C:\Users\%s\AppData\Roaming\Mozilla\Extensions\tracyplugin@tracy.com/`, user.Name)
	const lPath = `~/.Mozilla/extensions/tracyplugin@tracy.com/`

	var defaultPath string
	switch runtime.GOOS {
	case "linux":
		defaultPath = lPath
	case "windows":
		defaultPath = wPath
	case "darwin":
		defaultPath = dPath
	default:
		log.Error.Fatal("Unsupported operating system.")
	}

	return defaultPath
}
