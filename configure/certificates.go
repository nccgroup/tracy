package configure

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	l "log"
	"math/big"
	"net"
	"os"
	"path/filepath"
	"time"
	"tracy/log"
)

var SigningCertificate tls.Certificate

/*Certificates loads the local certificate pairs if they exist or generates new ones on the fly. */
func Certificates() tls.Certificate {
	publicKey, err := ReadConfig("public-key-loc")
	if err != nil {
		log.Error.Fatal(err)
	}
	privateKey, err := ReadConfig("private-key-loc")
	if err != nil {
		log.Error.Fatal(err)
	}
	cer, err := tls.LoadX509KeyPair(publicKey.(string), privateKey.(string))
	if err != nil {
		/* Cannot continue if the application doesn't have a valid certificate for TLS connections. Fail fast. */
		log.Error.Fatalf("Failed to parse certificate: %s", err.Error())
	}

	SigningCertificate = cer
	return cer
}

func generateRootCA(path string) {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		log.Error.Fatalf("Can not generate Private Key: %s", err)
	}

	notBefore := time.Now()

	notAfter := notBefore.Add(10000000000000000)

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
		l.Fatalf("Failed to create certificate: %s", err)
	}

	certOut, err := os.Create(filepath.Join(path, "cert.pem"))
	if err != nil {
		l.Fatalf("failed to open cert.pem for writing: %s", err)
	}

	pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes})
	certOut.Close()

	keyOut, err := os.OpenFile(filepath.Join(path, "key.pem"), os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		l.Fatalf("failed to open key.pem for writing: %s", err)
		return
	}

	b, err := x509.MarshalECPrivateKey(priv)
	if err != nil {
		l.Fatalf("Failed to get private key bytes: %s", err)
		return
	}

	pem.Encode(keyOut, &pem.Block{Type: "EC PRIVATE KEY", Bytes: b})
	keyOut.Close()
}
