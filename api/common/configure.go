package common

import (
	"encoding/json"
	"github.com/nccgroup/tracy/configure"
)

// GetConfig is the common functionality for getting the global configuration.
func GetConfig() ([]byte, error) {
	return json.Marshal(configure.ReadAllConfig())
}
