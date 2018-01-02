package types

/*Configuration holds all the configuration settings for the proxy. */
type Configuration struct {
	Tracers         map[string]string `json:"tracers"`
	DefaultTracer   string            `json:"default-tracer"`
	AutoFill        bool              `json:"autofill"`
	Filters         []string          `json:"filters"`
	ServerWhitelist []string          `json:"server-whitelist"`
	TracerServer    string            `json:"tracer-server"`
}
