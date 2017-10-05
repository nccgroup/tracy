package proxy

import (
	"bufio"
	"crypto/tls"
	"xxterminator-plugin/log"
	"net"
	"net/http"
	"net/http/httputil"
	"strings"
)

/*ListenAndServe waits and listens for TCP connections and proxies them. */
func ListenAndServe(ln net.Listener, cert tls.Certificate) {
	/* Never stop listening for TCP connections. */
	for {
		/* Block until a TCP connection comes in. */
		conn, err := ln.Accept()

		if err == nil {
			/* Pass case. Proxy the connection on a separate goroutine and go back to listening. */
			go handleConnection(conn, cert)
		}

		/* Log the current status and any errors. Errors don't fail fast. Errors happen and can be recovered from. */
		log.Trace.Printf("Handled connection %+v. Error: %+v", conn, err)
	}
}

func handleConnection(clientConn net.Conn, cer tls.Certificate) {
	defer clientConn.Close()
	request, err := http.ReadRequest(bufio.NewReader(clientConn))
	if err != nil {
		log.Error.Println(err)
		return
	}

	host := request.URL.Host
	scheme := "http"

	dump, _ := httputil.DumpRequest(request, true)
	log.Trace.Println(string(dump))

	if request.Method == "CONNECT" {
		clientConn, scheme, err = upgradeConnectionTLS(clientConn, cer, host)
		if err != nil {
			log.Error.Println(err)
			return
		}

		request, err = http.ReadRequest(bufio.NewReader(clientConn))
		if err != nil {
			log.Error.Println(err)
			return
		}

		dump, err = httputil.DumpRequest(request, true)
		if err != nil {
			log.Error.Println(err)
			return
		}

		log.Trace.Println(string(dump))

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
		log.Error.Println(errConnect)
		return
	}
	defer conn.Close()
	//conn.Write(dump)
	request.Write(conn)
	resp, err := http.ReadResponse(bufio.NewReader(conn), nil)
	if err != nil {
		log.Error.Println(err)
		return
	}

	responseRawBytes, err := httputil.DumpResponse(resp, true)
	if err != nil {
		log.Error.Printf("Got an error dumping the response: %s", err.Error())
	}
	go func() {
		err := proccessResponseTracers(responseRawBytes, request.RequestURI);
		if err != nil {
			log.Error.Printf("Error while processing the response: %s", err.Error())
		}
	}()
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
