package install

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"tracy/configure"
	"tracy/log"
	"tracy/plugin"
)

/*ExtensionName is the file that Firefox will use to read the packed extension. */
const ExtensionName = "tracyplugin@tracy.com.xpi"

/*Firefox is the interactive method for installing Tracy into the proper Firefox
 *extension folder. */
func Firefox() {
	cuser, err := user.Current()
	if err != nil {
		log.Error.Fatal(err)
	}

	dPath := filepath.Join(cuser.HomeDir, `/Library/Application Support/Mozilla/Extensions/`)
	wPath := filepath.Join(cuser.HomeDir, `AppData\Roaming\Mozilla\Firefox\Profiles\Extensions\`)
	lPath := filepath.Join(cuser.HomeDir, `.Mozilla/firefox/`)

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

	var path string
	for {
		path = Input(fmt.Sprintf("Where should the tracy extension be installed for Firefox (default: %s)?", defaultPath))
		if len(strings.Trim(path, " \n")) == 0 {
			if runtime.GOOS == "linux" {
				// Looks like there might be a case where 'Mozilla' is capitalized for some home directories.
				_, lerr := os.Stat(filepath.Join(cuser.HomeDir, ".mozilla"))
				_, uerr := os.Stat(filepath.Join(cuser.HomeDir, ".Mozilla"))
				if lerr == nil && uerr != nil {
					path = strings.Replace(defaultPath, "Mozilla", "mozilla", 1)
					break
				} else if lerr != nil && uerr != nil {
					//they both weren't there.
					log.PrintRed("Are you sure this is the correct path? It doesn't look like firefox is installed on this machine. Try to install it before continuing.\n")
				} else {
					// This indicates they have both. This probably shouldn't happen,
					// but in case it does, just pick the lower case one.
					path = strings.Replace(defaultPath, "Mozilla", "mozilla", 1)
					break
				}
			}
		} else {
			path = defaultPath
		}
	}

	if fPath := getFirefoxExtensionPath(path); path != "" {
		if validateInstallationPath(fPath, ExtensionName) {
			configure.UpdateConfig("installation-path", filepath.Join(path, ExtensionName))
			log.PrintGreen(`Try opening Firefox and granting tracy permission to be side-loaded:
1. Open Firefox and navigate to "about:addons". 
2. Click the "Enable" button on the right of the page.
3. If Tracy is not one the listed add-ons, try refreshing the page. Also, double check the installation path is correct.
`)
			err = exec.Command("firefox", "about:addons").Start()
			if err != nil {
				log.PrintRed("Couldn't open Firefox for you. Open Firefox and navigate to \"about:addons\"")
			}
		} else {
			log.Error.Fatalf("Doesn't look like the path %s doesn't work.", path)
		}
	} else {
		log.Error.Fatalf("Couldn't find a .default directory in %s", path)
	}
}

/* Helper function to find the appropriate profile folder Firefox uses to store extensions. */
func getFirefoxExtensionPath(path string) string {
	var ret string

	files, err := ioutil.ReadDir(path)
	if err != nil {
		log.Error.Fatal(err)
	}

	for _, f := range files {
		// All Firefox extension directories end with .default
		if strings.HasSuffix(f.Name(), ".default") {
			ret = filepath.Join(path, f.Name(), "extensions")
			break
		}
	}

	return ret
}

// Helper function to make sure the directory is there and if there an extension
// already in the directory to make sure the version number is up to date. If it isn't
// prompt the user to update to the latest version of the extension.
func validateInstallationPath(dir, extName string) bool {
	ret := false

	var version interface{}
	var err error
	version, err = configure.ReadConfig("version")
	if err != nil {
		log.Error.Fatal(err)
	}

	_, err = os.Stat(dir)
	if err == nil {
		// If the directory already exists, check the current version of the software.
		var fver float64
		fver, err = strconv.ParseFloat(version.(string), 32)
		if err != nil {
			log.Error.Fatal(err)
		}

		files, err := ioutil.ReadDir(dir)
		if err != nil {
			log.Error.Fatal(err)
		}

		// In the event there are multiple version of the extension, find the highest
		// version number.
		var max float64 = 0
		for _, f := range files {
			if f.Name() == extName {
				r, err := zip.OpenReader(filepath.Join(dir, f.Name()))
				if err != nil {
					// Doesn't think the file is a ZIP. Recoverable
					log.PrintRed(fmt.Sprintf("Found a non-compressable tracy file (%s). Maybe a corrupted old extension? Skipping.\n",
						filepath.Join(dir, f.Name())))
					continue
				}
				defer r.Close()

				for _, file := range r.File {
					if file.Name == "manifest.json" {
						var fd io.ReadCloser
						fd, err = file.Open()
						if err != nil {
							log.Error.Fatal("Not able to open the compressed manifest.json file.")
						}
						defer fd.Close()

						raw, err := ioutil.ReadAll(fd)
						if err != nil {
							log.Error.Fatal("Not able to read the compressed manifest.json file.")
						}

						var config map[string]interface{}
						json.Unmarshal(raw, &config)

						cv, err := strconv.ParseFloat(config["version"].(string), 32)
						if err != nil {
							log.Error.Fatal(err)
						}

						if cv > max {
							max = cv
						}
					}
				}
			}
		}

		// There was no extension found.
		if max == 0 {
			log.PrintGreen(fmt.Sprintf("No usable versions of the tracy extension found. Installing tracy at %s.", dir))
			ioutil.WriteFile(filepath.Join(dir, extName), plugin.FirefoxBinary, os.ModePerm)
			log.PrintGreen("Installed!")
			ret = true
		} else if fver > max {
			// The extension is out of date. Need to update before they continue.
			confirm := Input(fmt.Sprintf("Looks like the version that is already installed is behind (cur: %f, latest: %d). In order to use the latest version of Tracy, we need to update the extension. Is this ok? (Y/n)", max, version))
			switch strings.Trim(strings.ToLower(confirm), " ") {
			case "", "y":
				ioutil.WriteFile(filepath.Join(dir, extName), plugin.FirefoxBinary, os.ModePerm)
				log.PrintGreen("Installed!")
				ret = true
			case "n":
				log.PrintRed(fmt.Sprintf("Quiting. Use version %f of tracy instead.", max))
			default:
				log.PrintRed("Didn't understand your answer. Please type 'y' or 'n'")
			}
		} else if fver == max {
			log.PrintGreen(fmt.Sprintf("O cool. You already have version %s installed. Hoot!\n", version.(string)))
			ret = true
		}
	} else {
		if os.IsNotExist(err) {
			for {
				confirm := Input(fmt.Sprintf("%s doesn't exist yet. Are you sure that is the location you want to install? (y/N)", dir))
				switch strings.ToLower(strings.Trim(confirm, " \n")) {
				case "", "n":
					log.PrintRed("Quiting. Check your Firefox installation path and try again.")
					log.Error.Fatal("..")
					goto end
				case "y":
					// If the directory doesn't exist, create it.
					os.MkdirAll(dir, os.ModePerm)
					ioutil.WriteFile(filepath.Join(dir, extName), plugin.FirefoxBinary, os.ModePerm)
					goto end
				default:
					log.PrintRed("Unsupported choice.\n")
				}
			}
		end:
			ret = true
		}
	}

	return ret
}
