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

/*PublicKey is the default public key used for the server. */
const PublicKey = `-----BEGIN CERTIFICATE-----
MIIDAjCCAeqgAwIBAgIQb+C6es8TyPmvKTLscm29ijANBgkqhkiG9w0BAQsFADAS
MRAwDgYDVQQKEwdBY21lIENvMB4XDTE3MTAwNDE4MDE0MVoXDTE4MTAwNDE4MDE0
MVowEjEQMA4GA1UEChMHQWNtZSBDbzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCC
AQoCggEBAMGIt9ZzN5+lFvM5Np2MY9zhWlI4EO31yQ/1K5DGt3p4u0EZ31d23Jrg
Rzhash7B8qXA6hShM2ohQzuUhekeosMzAhg6k9X1ZOX7VO1+1+VNNJOgSFGRrA85
yCIi8Japzytp+e3VgezHJnKlOyojzzi1iKvFlvVVMLQ8cQY9FJBT9lqHFf3IHc/h
HV5Kmn9BQZyeEWiw54XTiTb5cJCpeHy+WsHnmZRuwu+gRGrKIGA8JDjvKrzGcprC
SOCATn11h8pSx2tJbFovLmolFwOJsp+r6ETVZqg6FcnpeLGDt4FMj2DOBK5FswVv
PvFzsdE8m2dGmB0xjzDuRrOO9D9YRYUCAwEAAaNUMFIwDgYDVR0PAQH/BAQDAgKk
MBMGA1UdJQQMMAoGCCsGAQUFBwMBMA8GA1UdEwEB/wQFMAMBAf8wGgYDVR0RBBMw
EYIPeHh0ZXJtaW5hdGUuY29tMA0GCSqGSIb3DQEBCwUAA4IBAQAitZv/uY6wemcs
zFAhTUdHbQs92NXUALUUQqaTASUD7/3w189QOdSgX5Jy2ZZaJ3+OO8lfXNfKECSI
SMQtvMhTtnF9Rr5kM6H21g9C+Dfbz3gy+PrsHJoin719sF0T+BDhVX0TpWyIVYS8
ri433infB3udgGQzj8gvQtqeUCoou/NAPE7ABNCr0wQdB+mtJGoTvCalCwnoD57o
QCUMjFRtrnObFi26uNMnxfESDBw8rbiwisN1HyNVk7rsTB1kI3wD4r5FN8mMhvVo
vCYhWIQfEKRu6Xz/NZtnAIUcmge9o+7FZbp1a/P5AsEoDnCRsQISsLmKgUj0puIW
jBy+zyI6
-----END CERTIFICATE-----`

/*PrivateKey is the default private key used for the server. */
const PrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAwYi31nM3n6UW8zk2nYxj3OFaUjgQ7fXJD/UrkMa3eni7QRnf
V3bcmuBHOFqyHsHypcDqFKEzaiFDO5SF6R6iwzMCGDqT1fVk5ftU7X7X5U00k6BI
UZGsDznIIiLwlqnPK2n57dWB7McmcqU7KiPPOLWIq8WW9VUwtDxxBj0UkFP2WocV
/cgdz+EdXkqaf0FBnJ4RaLDnhdOJNvlwkKl4fL5aweeZlG7C76BEasogYDwkOO8q
vMZymsJI4IBOfXWHylLHa0lsWi8uaiUXA4myn6voRNVmqDoVyel4sYO3gUyPYM4E
rkWzBW8+8XOx0TybZ0aYHTGPMO5Gs470P1hFhQIDAQABAoIBAAehdF4oPNE2mSkN
4HFlz6ot2HnVbBV102+lowoaS7GwgPGYK44vSZNxtF0sdklwLDkM2i3mDTjqBtSa
jo0agCBiKnr6FEojWs8WkcqrbafE24XWlANjUv1msdVmu0W1fE2h6BDQkkbbs1Bh
42tN7iW2QqVDLSiPK1Rv7aTpU549H7QJerFpVuDLtEQZOE9heHKsFl57AkpzNKm7
EjeVC2PuWBAjMCil9W3reI6xmHQyxM6ayu322S7M/JlCciFePiiTt9LUHan8vCOr
h/9nnZuBn4WeHuK4I7Az91/IIafVQ0ncOZtsoXPXOcz4zRbypOEVPYtTTYMIIunf
HdskYiECgYEA3v5O6aslJUKP1S0df8QaaxixH60m3Wz4oCsLxJvC4MtPbtlftmM1
qRyh1A3rQPZImQIqNaOlg3Jv0ZwkhGavKlMkqHSFR0w0SCNqYzf/7T87ZY1Lhyt+
6rFEBYBJC2H4PTbQTzYjct1oVKxrbt06X65FedsUbyIsh8QBM7it9IcCgYEA3i4i
G2R3WdOZsmp9gn+IV0s0LCDaAzc4hXx/5+3XPT5Wv6zEF+oUCmGRNxVTdwNj/TU5
UCsufg2OXUk1aQSCQEHkX05Z5EB3hMAGbPcq9WoGzIBK0FhemG/c+MPnT2Uuwsu5
NFCuDWKcJuG0C3+HAX7v0VKsf1S8ZsL3+763RJMCgYA6BvdF+xE5du6yzICmpMMz
J0PAOHCqoha4pzryuI2nrYBIGiy762klTpwV8GFNkEkn99ZACwug/wB2DSm7gnUG
kIgzhc7A1OWt9/lRRFtGw3OTY4dJ71mhfOt0ewOHAMF2PHNMiYwD8fWaQxvZx5vP
FixiH05b9QqdcbXWXbJ2tQKBgECXrujBy4T85IkfNn/y7cNbJL7Tii43JqKAMHtQ
BSxT7EprQtMlBVCDTwFxnMNT5ATgLVpmQ2z4KfRq7TEr02Y1AdzHXZDjQRwB65xQ
O1f/zBw2DAoINvAgTWCxK5VEeFS/f4d7ES7pBTa0lXBmUeyYZ8Y2P9oA24kQk6HH
r2YrAoGAMtP0PcS5uQW/k/tqZQjcNgBrDzyA0NJcQpzZHBLac1eQtI+w8bvuYJKX
sLIcLOxku1jW3CaRt44XOGyXBACbBCn49K8p+AYDnL12Pflu3mykbvien7AmZMLY
omOcYk1CqeNw90/WhoUDlr/C6imiHFsCXWc5zp4lYc3rqJknO84=
-----END RSA PRIVATE KEY-----`

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
