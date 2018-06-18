package proxy

import (
	"bufio"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
	"io/ioutil"
	"math/big"
	"net"
	"net/http"
	"os"
	"strings"
	"time"
)

/* Upgrade a TLS connection if the proxy receives a 'CONNECT' action from the connection. */
func upgradeConnectionTLS(conn net.Conn, host string) (net.Conn, bool, error) {
	/* Respond to the client with 200 to inform them that a TLS connection is possible. */
	resp := http.Response{Status: "Connection established", Proto: "HTTP/1.0", ProtoMajor: 1, StatusCode: 200}
	resp.Write(conn)

	/* Read the incoming connection. */
	connBuff := newBufferedConn(conn)

	/* Peek at the first byte of the HTTP string. */
	get, err := connBuff.Peek(3)
	if err != nil {
		return nil, false, err
	}

	/* If the first three bytes are 'GET', the request is using a GET verb and the protocol can be guessed to be HTTP. */
	if string(get) == "GET" {
		return connBuff, false, nil
	}

	r := &cacheRequest{
		host: host,
		err:  make(chan error),
		resp: make(chan tls.Certificate),
	}
	cacheChan <- r
	err = <-r.err

	if err != nil {
		return nil, false, err
	}

	newCer := <-r.resp
	config := &tls.Config{Certificates: []tls.Certificate{newCer}}
	clientConn := tls.Server(connBuff, config)

	return clientConn, true, nil
}

/*KeyPairBytes is a byte representation of the certificate and private key for specific host's signed certificate. This is serialized in a cache file to be reused when the program terminates. */
type KeyPairBytes struct {
	CertPEM []byte `json:"CertPEM"`
	KeyPEM  []byte `json:"KeyPEM"`
}

/*CertCacheEntry is an entry in the certificate cache. It contains the host and the KeyPairBytes that was used to generate the certificate. */
type CertCacheEntry struct {
	Host  string `json:"Host"`
	Certs KeyPairBytes
}

func generateCert(host string, cert tls.Certificate) (tls.Certificate, KeyPairBytes, error) {
	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)
	if err != nil {
		return tls.Certificate{}, KeyPairBytes{}, err
	}
	notBefore := time.Now()
	// Certificate validity set to one year.
	notAfter := notBefore.AddDate(1, 0, 0)

	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			Organization: []string{"Tracy the Tracer"},
		},
		NotBefore: notBefore,
		NotAfter:  notAfter,

		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}

	template.DNSNames = []string{strings.Split(host, ":")[0]}

	certs, err := x509.ParseCertificates(cert.Certificate[0])
	if err != nil {
		return tls.Certificate{}, KeyPairBytes{}, err
	}

	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return tls.Certificate{}, KeyPairBytes{}, err
	}
	derBytes, err := x509.CreateCertificate(rand.Reader, &template, certs[0], priv.Public(), cert.PrivateKey)
	if err != nil {
		return tls.Certificate{}, KeyPairBytes{}, err
	}

	b, err := x509.MarshalECPrivateKey(priv)
	if err != nil {
		return tls.Certificate{}, KeyPairBytes{}, err
	}
	newCer, err := tls.X509KeyPair(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: derBytes}), pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: b}))

	keyPairBytes := KeyPairBytes{
		KeyPEM:  b,
		CertPEM: derBytes,
	}
	return newCer, keyPairBytes, err
}

/*SetCertCache initializes the certificate cache and starts the go routine that serves the cache requests. */
func SetCertCache(cache map[string]tls.Certificate) {
	cacheChan = make(chan *cacheRequest, 10)
	go certCache(cacheChan, cache)
}

//TODO: Might be worth preloading this cache with known hosts like google.com. Currently, it is
// taking a lot of time to generate these certificates
var cache map[string]tls.Certificate
var cacheChan chan *cacheRequest

type cacheRequest struct {
	host string // host querying
	err  chan error
	resp chan tls.Certificate // result
}

// Accessing the cache needs to be thread safe since multiple connections will be accessing it
// and some of those threads might trigger from the same host. If this function is not thread
// safe, we'll get duplicate on-the-fly certificate generations, which is a lot of extra cycles.
func certCache(cacheChan chan *cacheRequest, cache map[string]tls.Certificate) {
	// Long-lived loop. Avoid memory allocations by reusing these.
	var (
		r          *cacheRequest
		newCer     tls.Certificate
		err        error
		cacheEntry KeyPairBytes
		exists     bool
	)

	for {
		r = <-cacheChan

		// This is a transaction. If we have a cache miss, we can't process the next
		// cache request until we've generated a new certificate and added it to the
		// cache, otherwise race conditions will unnecessary generate certificates
		// for duplicate hosts.
		if newCer, exists = cache[r.host]; exists {
			log.Trace.Printf("Cache hit for %s\n", r.host)
			r.err <- nil
			r.resp <- newCer
		} else {
			log.Trace.Printf("Cache miss for %s...\n", r.host)
			newCer, cacheEntry, err = generateCert(r.host, configure.SigningCertificate)

			if err != nil {
				log.Error.Println(err)
				r.err <- err
			} else {
				go func() {
					// Write the entry to the cache file
					if err := writeCertCacheFile(cacheEntry, r.host, configure.CertCacheFile); err != nil {
						log.Error.Println(err)
					}
				}()
				cache[r.host] = newCer
				r.err <- nil
				r.resp <- newCer
			}
		}

	}
}

func writeCertCacheFile(keyPairBytes KeyPairBytes, host, certCacheFile string) error {
	var err error
	var cacheJSON []byte
	if cacheJSON, err = ioutil.ReadFile(certCacheFile); err == nil {
		certs := []CertCacheEntry{}
		if err = json.Unmarshal(cacheJSON, &certs); err == nil {
			newEntry := CertCacheEntry{
				Host:  host,
				Certs: keyPairBytes,
			}
			certs = append(certs, newEntry)
			var certsJSON []byte
			if certsJSON, err = json.Marshal(certs); err == nil {
				ioutil.WriteFile(certCacheFile, certsJSON, os.ModePerm)
			}
		}
	}

	return err
}

type bufferedConn struct {
	r        *bufio.Reader
	net.Conn // So that most methods are embedded
}

func newBufferedConn(c net.Conn) bufferedConn {
	return bufferedConn{bufio.NewReader(c), c}
}

func newBufferedConnSize(c net.Conn, n int) bufferedConn {
	return bufferedConn{bufio.NewReaderSize(c, n), c}
}

func (b bufferedConn) Peek(n int) ([]byte, error) {
	return b.r.Peek(n)
}

func (b bufferedConn) Read(p []byte) (int, error) {
	return b.r.Read(p)
}
