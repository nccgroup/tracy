package proxy

import (
	"bufio"
	"crypto/tls"
	"net"
	"net/http"
	"net/http/httputil"
	"strings"
	"xxterminator-plugin/log"
	tracerClient "xxterminator-plugin/tracer/client"
	"xxterminator-plugin/tracer/configure"
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
		} else {
			log.Error.Println(err)
		}

		/* Log the current status and any errors. Errors don't fail fast. Errors happen and can be recovered from. */
		log.Trace.Printf("Handled connection %+v.", conn)
	}
}

/* Helper function that handles any TCP connections to the proxy. Client refers to the client making the connection to the
 * proxy. Server refers to the actual server they are attempting to connect to after going through the proxy. */
func handleConnection(client net.Conn, cer tls.Certificate) {
	defer client.Close()
	/* Read a request structure from the TCP connection. */
	request, err := http.ReadRequest(bufio.NewReader(client))
	/* Throw an error and fail fast if it doesn't look like HTTP. */
	if err != nil {
		log.Error.Println(err)
		return
	}

	host := request.URL.Host
	scheme := "http"

	/* Dump the request structure as a slice of bytes. */
	dump, _ := httputil.DumpRequest(request, true)
	log.Trace.Println(string(dump))

	/* If the request method is `CONNECT`, it's either a TLS connection or a websocket. */
	if request.Method == http.MethodConnect {
		/* Try to upgrade the `CONNECT` request to a TLS connection with the configured certificate. */
		client, scheme, err = upgradeConnectionTLS(client, cer, host)
		if err != nil {
			log.Error.Println(err)
			return
		}

		/* After the connection has been upgraded, reread the request structure over TLS. */
		request, err = http.ReadRequest(bufio.NewReader(client))
		/* Fail fast if the protocol doesn't look like HTTP. */
		if err != nil {
			log.Error.Println(err)
			return
		}

		/* Read the request structure as a slice of bytes. */
		dump, err = httputil.DumpRequest(request, true)
		if err != nil {
			log.Error.Println(err)
			return
		}

		log.Trace.Println(string(dump))

	}

	/* Check if the host is the tracer API server. We don't want to trigger anything if we accidentally proxied a tracer
	 * server API call because it will trigger a recursion. */
	if !configure.ServerInWhitelist(host) {
		/* Search through the request for the tracer keyword. */
		tracers, err := replaceTracers(request)

		if err != nil {
			/* If there was an error replacing the tracers, fail fast and leave. */
			log.Error.Println(err)
			return
		}

		/* Use the tracer API client to add the new tracers. */
		go tracerClient.AddTracers(tracers)
	}

	var server net.Conn

	/* Based on the scheme, the API is different to backside of the proxy connection. */
	if scheme == "http" {
		if strings.Index(host, ":") == -1 {
			server, err = net.Dial("tcp", host+":80")
		} else {
			server, err = net.Dial("tcp", host)
		}
	} else if scheme == "https" {
		/* If the scheme is HTTPS, need to the use the tls package to make the dial. */
		server, err = tls.Dial("tcp", host, nil)
	} else {
		/* Only support HTTP and HTTPS. Fail fast if another scheme is set up. */
		log.Error.Printf("Unrecognized scheme: %s", scheme)
		return
	}

	/* Fail fast if the connection to the backside of the proxy failed. */
	if err != nil {
		log.Error.Println(err)
		return
	}
	defer server.Close()

	/* Write the entire request to the backside connection of the proxy. */
	request.Write(server)

	/* Check for errors. */
	resp, err := http.ReadResponse(bufio.NewReader(server), nil)
	if err != nil {
		log.Error.Println(err)
		return
	}

	/* If no errors, read the response as a slice of bytes. */
	responseRawBytes, err := httputil.DumpResponse(resp, true)
	if err != nil {
		log.Error.Printf("Got an error dumping the response: %s", err.Error())
		return
	}

	/* Check if the host is the tracer API server. We don't want to trigger anything if we accidentally proxied a tracer
	 * server API call because it will trigger a recursion. */
	if !configure.ServerInWhitelist(host) {
		/* Search for any known tracers in the response. Since the list of tracers might get large, perform this operation
		 * in a goroutine. The proxy can finish this connection before this finishes. */
		go func() {
			/* Get a current list of the tracers so they can be searched for. */
			tracers, err := tracerClient.GetTracers()
			if err != nil {
				/* If there is an error, fail fast and leave. */
				log.Error.Println(err)
				return
			}

			/* Get the tracer events that correspond to tracers found in the response. */
			splits := strings.Split(string(responseRawBytes), "\r\n\r\n")
			if len(splits) == 2 {
				//log.Error.Printf("Splits: %s\n %s", splits[0][:15], splits[1][:15])
				tracerEvents := findTracersInResponseBody(splits[1], request.RequestURI, tracers)

				log.Trace.Printf("Found the following tracer events: %+v", tracerEvents)
				/* Use the API to add each tracer events to their corresponding tracer. */
				tracerClient.AddTracerEvents(tracerEvents)
			}
		}()
	}

	/* Right the response back to the client. */
	resp.Write(client)

	/* If the backside of the proxy tries to change the protocol, forward this change and simply copy the bytes
	 * between the two connection until they are finished. */
	if resp.StatusCode == http.StatusSwitchingProtocols {
		/* Bridge blocks until the connections are finished talking, so client-to-server communication needs to
		 * be in its own goroutine. */
		go bridge(client, server)
		/* Block on server-to-client communication until both connections are finished. */
		bridge(server, client)
	}
}

/* Helper function for reading bytes from one connection and writing them to another connection. */
func bridge(client net.Conn, server net.Conn) {
	buf := make([]byte, 1024*4)
	for {
		/* Read up to 1024*4 bytes from the client. */
		nb, err := client.Read(buf)
		if err != nil {
			/* If there was an error, fail fast. */
			log.Error.Println(err)
			return
		}
		/* If the number of bytes read is zero, the client is finished. Leave. */
		if nb == 0 {
			return
		}

		/* Copy the bytes read above to the other connection. */
		nr, err := server.Write(buf[:nb])

		if err != nil {
			/* If there was an error, fail fast. */
			log.Error.Println(err)
			return
		}

		/* If the number of bytes written is zero, it probably means no bytes were read or the connection closed.
		 * In either case, leave. */
		if nr == 0 {
			return
		}
	}
}
