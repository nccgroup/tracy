package configure

import (
	"crypto/tls"
	"net"
	"xxterminator-plugin/log"
)

/* TODO: need to make a configuration file for these parameters. */
const addr = "127.0.0.1:7777"
const publicKey = "cert.pem"
const privateKey = "key.pem"

/*ProxyServer configures the TCP listener based on the user's configuration. */
func ProxyServer() net.Listener {
	ret, err := net.Listen("tcp", addr)
	if err != nil {
		/* Cannot continue if the application doesn't have TCP listener. Fail fast. */
		log.Error.Fatalf("Cannot listen on %s: %s", addr, err.Error())
	}

	return ret
}

/*Certificates loads the local certificate pairs if they exist or generates new ones on the fly. */
func Certificates() tls.Certificate {
	cer, err := tls.LoadX509KeyPair(publicKey, privateKey)
	if err != nil {
		/* Cannot continue if the application doesn't have a valid certificate for TLS connections. Fail fast. */
		log.Error.Fatalf("Failed to parse certificate: %s", err.Error())
	}

	return cer
}
