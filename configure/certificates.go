package configure

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"net"
	"os"
	"path/filepath"
	"time"

	"github.com/nccgroup/tracy/log"
)

// Certificates loads the local certificate pairs if they exist or generates new
// ones on-the-fly.
func Certificates() {
	k, err := tls.LoadX509KeyPair(
		Current.PublicKeyLocation,
		Current.PrivateKeyLocation)
	if err != nil {
		// Cannot continue if the application doesn't have a valid
		// certificate for TLS connections.
		log.Error.Fatalf("failed to parse certificate: %v", err)
	}
	Current.SigningCertificate = &k
}

// generateRootCA generates a root certificate authority used to sign
// certificates that are generated on-the-fly for each host the browser
// visits while Tracy intercepts traffic.
func generateRootCA(path string) {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		log.Error.Fatalf("can not generate Private Key: %v", err)
	}

	notBefore := time.Now()
	// Certificate validity set to one year.
	notAfter := notBefore.AddDate(1, 0, 0)

	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)

	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			Organization: []string{"Tracy the Tracer"},
		},
		NotBefore: notBefore,
		NotAfter:  notAfter,
		IsCA:      true,

		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		IPAddresses:           []net.IP{net.ParseIP("127.0.0.1")},
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, priv.Public(), priv)
	if err != nil {
		log.Error.Fatalf("failed to create certificate: %v", err)
	}

	certOut, err := os.Create(filepath.Join(path, "cert.pem"))
	if err != nil {
		log.Error.Fatalf("failed to open cert.pem for writing: %v", err)
	}

	pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes})
	certOut.Close()

	keyOut, err := os.OpenFile(filepath.Join(path, "key.pem"), os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		log.Error.Fatalf("failed to open key.pem for writing: %v", err)
		return
	}

	b, err := x509.MarshalECPrivateKey(priv)
	if err != nil {
		log.Error.Fatalf("failed to get private key bytes: %v", err)
		return
	}

	pem.Encode(keyOut, &pem.Block{Type: "EC PRIVATE KEY", Bytes: b})
	keyOut.Close()
}
