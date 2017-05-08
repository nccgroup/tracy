package main

import (
	"bufio"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"log"
	"math/big"
	"net"
	"net/http"
	"strings"
	"time"
)

func upgradeConnectionTLS(conn net.Conn, cert tls.Certificate, host string) (net.Conn, string, error) {

	resp := http.Response{Status: "Connection established", Proto: "HTTP/1.0", ProtoMajor: 1, StatusCode: 200}
	resp.Write(conn)

	connBuff := newBufferedConn(conn)

	get, err := connBuff.Peek(1)
	if err != nil {
		return nil, "", err
	}

	if string(get) == "G" {
		return connBuff, "http", nil
	}

	newCer, err := certCache(host)

	if err != nil { //If the cert is not cached make it and cache it
		newCer, err = generateCert(host, cert)
		if err != nil {
			return nil, "", err
		}
		cache[host] = newCer
	}

	config := &tls.Config{Certificates: []tls.Certificate{newCer}}

	clientConn := tls.Server(connBuff, config)

	return clientConn, "https", nil
}

func generateCert(host string, cert tls.Certificate) (tls.Certificate, error) {
	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)
	if err != nil {
		return tls.Certificate{}, err
	}
	notBefore := time.Now()
	notAfter := notBefore.Add(10000000000000000)

	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			Organization: []string{"Test Co"},
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
		return tls.Certificate{}, err
	}

	priv, err := ecdsa.GenerateKey(elliptic.P521(), rand.Reader)
	derBytes, err := x509.CreateCertificate(rand.Reader, &template, certs[0], priv.Public(), cert.PrivateKey)
	if err != nil {
		return tls.Certificate{}, err
	}

	b, err := x509.MarshalECPrivateKey(priv)
	newCer, err := tls.X509KeyPair(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: derBytes}), pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: b}))

	return newCer, err
}

var cache map[string]tls.Certificate

func certCache(host string) (tls.Certificate, error) {
	if cache == nil {
		cache = make(map[string]tls.Certificate)
		return tls.Certificate{}, fmt.Errorf("No cached cert")
	}

	if cert, exist := cache[host]; exist {
		log.Println("Cache hit!")
		return cert, nil
	}

	return tls.Certificate{}, fmt.Errorf("No cached cert")
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
