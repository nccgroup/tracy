package common

import (
	"encoding/json"
	"xxterminator-plugin/configure"
)

/*GetConfig is the common functionality for getting the global configuration. */
func GetConfig() ([]byte, error) {
	return json.Marshal(configure.ReadAllConfig())
}
