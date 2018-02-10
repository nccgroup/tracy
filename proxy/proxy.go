package proxy

import (
	"bufio"
	"bytes"
	"compress/gzip"
	"crypto/tls"
	"encoding/json"
	"io"
	"io/ioutil"
	"net"
	"net/http"
	"net/http/httputil"
	"strings"
	tracerClient "tracy/api/client"
	"tracy/api/common"
	"tracy/api/types"
	"tracy/configure"
	"tracy/log"
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
	isHTTPS := false

	/* Dump the request structure as a slice of bytes. */
	if log.Verbose {
		dump, _ := httputil.DumpRequest(request, true) //This should only run if in debug mode
		log.Trace.Println(string(dump))
	}

	/* If the request method is `CONNECT`, it's either a TLS connection or a websocket. */
	if request.Method == http.MethodConnect {
		/* Try to upgrade the `CONNECT` request to a TLS connection with the configured certificate. */
		client, isHTTPS, err = upgradeConnectionTLS(client, cer, host)
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
		if log.Verbose {
			dump, err := httputil.DumpRequest(request, true) //This should only run in debug mode
			if err != nil {
				log.Error.Println(err)
				return
			}

			log.Trace.Println(string(dump))
		}

	}

	/* Search through the request for the tracer keyword. */
	tracers, err := replaceTracers(request)

	if err != nil {
		/* If there was an error replacing the tracers, fail fast and leave. */
		log.Error.Println(err)
		return
	}

	/* Check if the host is the tracer API server. We don't want to trigger anything if we accidentally proxied a tracer
	 * server API call because it will trigger a recursion. */
	go func() {
		if !configure.ServerInWhitelist(host) && len(tracers) > 0 {
			dump, err := httputil.DumpRequest(request, true)
			if err != nil {
				dump = []byte("ERROR DUMPING")
			}

			req := types.Request{
				RawRequest:    string(dump),
				RequestURL:    request.Host + request.RequestURI,
				RequestMethod: request.Method,
				Tracers:       tracers,
			}

			/* Use the tracer API client to add the new tracers. */
			tracerClient.AddTracers(req)
		}
	}()

	var server net.Conn

	/* Based on the scheme, the API is different to backside of the proxy connection. */
	if !isHTTPS {
		if strings.Index(host, ":") == -1 {
			server, err = net.Dial("tcp", host+":80")
		} else {
			server, err = net.Dial("tcp", host)
		}
	} else {
		/* If the scheme is HTTPS, need to the use the tls package to make the dial. */
		server, err = tls.Dial("tcp", host, &tls.Config{InsecureSkipVerify: true})
	}

	/* Fail fast if the connection to the backside of the proxy failed. */
	if err != nil {
		log.Error.Println(err)
		return
	}
	defer server.Close()

	/* Write the entire request to the backside connection of the proxy. */
	request.Write(server)

	resp, err := http.ReadResponse(bufio.NewReader(server), nil)
	if err != nil {
		log.Error.Println(err)
		return
	}

	var save bytes.Buffer
	b, err := ioutil.ReadAll(io.TeeReader(resp.Body, &save))
	if err != nil {
		panic(err)
	}

	/* Check if the host is the tracer API server. We don't want to trigger anything if we accidentally proxied a tracer
	 * server API call because it will trigger a recursion. */
	if !configure.ServerInWhitelist(host) {
		/* Search for any known tracers in the response. Since the list of tracers might get large, perform this operation
		 * in a goroutine. The proxy can finish this connection before this finishes. */
		go func() {
			// Check that the server actually sent compressed data
			var err error
			if resp.Header.Get("Content-Encoding") == "gzip" {
				// Note that we are only reading the response body. No longer a need to manually filter it out
				var reader io.ReadCloser
				if reader, err = gzip.NewReader(bytes.NewReader(b)); err == nil {
					defer reader.Close()
					b, err = ioutil.ReadAll(reader)
				}
			}

			if err == nil {
				/* Get a current list of the tracers so they can be searched for. */
				var requestsJSON []byte
				requestsJSON, err = common.GetTracers()
				if err == nil {
					requests := []types.Request{}
					err = json.Unmarshal(requestsJSON, &requests)
					if err == nil {
						if len(requests) != 0 {
							log.Trace.Printf("Need to parse the following %d requests for tracer strings: %+v", len(requests), requests)

							url := request.Host + request.RequestURI
							tracers := FindTracersInResponseBody(string(b), url, requests)

							/* Use the API to add each tracer events to their corresponding tracer. */
							for _, tracer := range tracers {
								for _, event := range tracer.TracerEvents {
									//TODO: should probably make a bulk add events function
									_, err = common.AddEvent(tracer, event)
								}
							}

						}
					}
				}
			}

			if err != nil {
				log.Error.Println(err)
			}
		}()
	}

	/* Right the response back to the client. */
	resp.Body = ioutil.NopCloser(&save)
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
			/* If there was an error, fail fast unless EOF. */
			if err != io.EOF {
				log.Error.Println(err)
				return
			}
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

//copied from https://golang.org/src/net/http/httputil/dump.go?s=8166:8231#L271
// drainBody reads all of b to memory and then returns two equivalent
// ReadClosers yielding the same bytes.
//
// It returns an error if the initial slurp of all bytes fails. It does not attempt
// to make the returned ReadClosers have identical error-matching behavior.
func drainBody(b io.ReadCloser) (r1, r2 io.ReadCloser, err error) {
	if b == http.NoBody {
		// No copying needed. Preserve the magic sentinel meaning of NoBody.
		return http.NoBody, http.NoBody, nil
	}
	var buf bytes.Buffer
	if _, err = buf.ReadFrom(b); err != nil {
		return nil, b, err
	}
	if err = b.Close(); err != nil {
		return nil, b, err
	}
	return ioutil.NopCloser(&buf), ioutil.NopCloser(bytes.NewReader(buf.Bytes())), nil
}
