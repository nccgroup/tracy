package main

import (
	"crypto/tls"
	"log"
	"net"
)

func main() {

	ln, err := net.Listen("tcp", ":8080")
	if err != nil {
		log.Fatalf("Failed to listen: %s", err)
	}

	cer, err := tls.LoadX509KeyPair("server.pem", "server.key")
	if err != nil {
		log.Fatalf("Failed to parse certificate: %s", err)
	}

	for {
		conn, err := ln.Accept()
		if err != nil {
			log.Println(err)
			continue
		}

		go handleConnection(conn, cer)
	}

}

//only send a connect when it is over tls
