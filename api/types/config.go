package types

import "crypto/tls"

// Configuration is a struct that holds the configration options for the
// environment.
type Configuration struct {
	TracerStrings      map[string]string `json:TracerStrings`
	ServerWhitelist    []Server          `json:ServerWhitelist`
	TracerServer       Server            `json:TracerServer`
	ProxyServer        Server            `json:ProxyServer`
	AutoLaunch         bool              `json:AutoLaunch`
	PublicKeyLocation  string            `json:PublicKeylocation`
	PrivateKeyLocation string            `json:PrivateKeyLocation`
	DebugUI            bool              `json:DebugUI`
	CertCachePath      string            `json:CertCachePath`
	DatabasePath       string            `json:DatabaseFile`
	TracyPath          string            `json:TracyPath`
	Version            string            `json:Version`
	SigningCertificate tls.Certificate   `json:SigningCertificate`
}
