package main

import (
	"bufio"
	"crypto/tls"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"strings"
)

func handleConnection(clientConn net.Conn, cer tls.Certificate) {
	defer clientConn.Close()
	request, err := http.ReadRequest(bufio.NewReader(clientConn))
	if err != nil {
		log.Println(err)
		return
	}

	host := request.URL.Host
	scheme := "http"

	dump, _ := httputil.DumpRequest(request, true)
	log.Println(string(dump))

	if request.Method == "CONNECT" {
		clientConn, scheme, err = upgradeConnectionTLS(clientConn, cer, host)
		if err != nil {
			log.Println(err)
			return
		}

		request, err = http.ReadRequest(bufio.NewReader(clientConn))
		if err != nil {
			log.Println(err)
			return
		}

		dump, err = httputil.DumpRequest(request, true)
		if err != nil {
			log.Println(err)
			return
		}

		log.Println(string(dump))

	}

	addTracers(request) //add error handling here

	var conn net.Conn
	var errConnect error

	if scheme == "http" {
		if strings.Index(host, ":") == -1 {
			conn, errConnect = net.Dial("tcp", host+":80")
		} else {
			conn, errConnect = net.Dial("tcp", host)
			if errConnect != nil {
				return
			}
		}
	} else if scheme == "https" {
		conn, errConnect = tls.Dial("tcp", host, nil)
	}

	if errConnect != nil {
		log.Println(errConnect)
		return
	}
	defer conn.Close()
	//conn.Write(dump)
	request.Write(conn)
	resp, err := http.ReadResponse(bufio.NewReader(conn), nil)
	if err != nil {
		log.Println(err)
		return
	}

	go proccessResponseTracers(*resp)
	resp.Write(clientConn)

	if resp.StatusCode == 101 {
		go bridge(clientConn, conn)
		bridge(conn, clientConn)
	}
}

func bridge(conn net.Conn, conn2 net.Conn) {
	buf := make([]byte, 1024*4)
	for {
		nb, err := conn.Read(buf)
		if err != nil || nb == 0 {
			return
		}
		nr, err := conn2.Write(buf[:nb])
		if err != nil || nr == 0 {
			return
		}
	}
}
