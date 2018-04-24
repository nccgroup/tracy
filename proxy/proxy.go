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
	"tracy/api/common"
	"tracy/api/store"
	"tracy/api/types"
	"tracy/configure"
	"tracy/log"
)

/*ListenAndServe waits and listens for TCP connections and proxies them. */
func ListenAndServe(ln net.Listener) {
	/* Never stop listening for TCP connections. */
	for {
		/* Block until a TCP connection comes in. */
		conn, err := ln.Accept()

		if err == nil {
			/* Pass case. Proxy the connection on a separate goroutine and go back to listening. */
			go handleConnection(conn)
		} else {
			log.Error.Println(err)
		}

		/* Log the current status and any errors. Errors don't fail fast. Errors happen and can be recovered from. */
		log.Trace.Printf("Handled connection %+v.", conn)
	}
}

/* Helper function that handles any TCP connections to the proxy. Client refers to the client making the connection to the
 * proxy. Server refers to the actual server they are attempting to connect to after going through the proxy. */
func handleConnection(client net.Conn) {
	/* Read a request structure from the TCP connection. */
	request, err := http.ReadRequest(bufio.NewReader(client))

	if err == io.EOF {
		return
	}

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
		client, isHTTPS, err = upgradeConnectionTLS(client, host)
		if err == io.EOF {
			return
		}

		if err != nil {
			log.Error.Println(err)
			return
		}

		/* After the connection has been upgraded, reread the request structure over TLS. */
		request, err = http.ReadRequest(bufio.NewReader(client))

		if err == io.EOF {
			return
		}

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

	/* Moving the client close here for the same reason as request, above. */
	if client != nil {
		defer client.Close()
	}

	// This custom header is used to tell tracy to not do any swapping of values.
	if !configure.ServerInWhitelist(host) && request.Header.Get("X-TRACY") == "" {
		// Look for tracers that might have been generated out of band using the API.
		// Do this by checking if there exists a tracer, but we have no record of which
		// request it came from.
		dump, err := httputil.DumpRequest(request, true)
		method := request.Method
		go func() {
			if err == nil {
				dumpStr := string(dump)
				var tracersBytes []byte
				tracersBytes, err = common.GetTracers(false)
				if err == nil {
					var requests []types.Request
					err = json.Unmarshal(tracersBytes, &requests)
					if err == nil {
						for _, req := range requests {
							for _, tracer := range req.Tracers {
								if strings.Contains(dumpStr, tracer.TracerPayload) && req.RawRequest == "GENERATED" {
									req.RawRequest = dumpStr
									req.RequestMethod = method

									//Update the record
									err = store.DB.Save(&req).Error
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
				if err == nil {
					req := types.Request{
						RawRequest:    string(dump),
						RequestURL:    request.Host + request.RequestURI,
						RequestMethod: request.Method,
						Tracers:       tracers,
					}

					/* Use the API to add each tracer events to their corresponding tracer. */
					_, err = common.AddTracer(req)
				}

				if err != nil {
					log.Error.Println(err)
				}
			}
		}()
	}

	var server net.Conn

	/* Based on the scheme, the API is different to backside of the proxy connection. */
	//TODO: I think we can change the default transport here to timeout a bit faster and to
	//use connections
	if !isHTTPS {

		if strings.Index(host, ":") == -1 {
			server, err = net.Dial("tcp", host+":80")
		} else {
			server, err = net.Dial("tcp", host)
		}

		if server != nil {
			defer server.Close()
		}

		/* Fail fast if the connection to the backside of the proxy failed. */
		if err != nil {
			log.Error.Println(err)
			return
		}
	} else {
		var tserver *tls.Conn
		/* If the scheme is HTTPS, need to the use the tls package to make the dial. */
		tserver, err = tls.Dial("tcp", host, &tls.Config{InsecureSkipVerify: true})

		// Have to check for nil differently with tls.Dial because it return a pointer
		// of a connection instead of a struct
		var nilTest *tls.Conn
		if tserver != nilTest {
			server = tserver
			defer server.Close()
		}

		if err == io.EOF {
			return
		}

		if err != nil {
			log.Error.Println(err)
			return
		}
	}

	/* Write the entire request to the backside connection of the proxy. */
	request.Write(server)

	resp, err := http.ReadResponse(bufio.NewReader(server), nil)
	if resp != nil {
		defer resp.Body.Close()
	}

	if err != nil {
		log.Error.Println(err)
		return
	}

	var save bytes.Buffer
	b, err := ioutil.ReadAll(io.TeeReader(resp.Body, &save))
	if err != nil {
		log.Error.Println(err)
		return
	}

	/* Search for any known tracers in the response. Since the list of tracers might get large, perform this operation
	 * in a goroutine. The proxy can finish this connection before this finishes. */
	go func() {
		/* Check if the host is the tracer API server. We don't want to trigger anything if we accidentally proxied a tracer
		 * server API call because it will trigger a recursion. */
		if !configure.ServerInWhitelist(host) {
			// Check that the server actually sent compressed data
			var err error
			if resp.Header.Get("Content-Encoding") == "gzip" {
				// Note that we are only reading the response body. No longer a need to manually filter it out
				var reader io.ReadCloser
				if reader, err = gzip.NewReader(bytes.NewReader(b)); err == nil && reader != nil {
					defer reader.Close()
					b, err = ioutil.ReadAll(reader)
				}
			}

			if err == nil {
				/* Get a current list of the tracers so they can be searched for. */
				var requestsJSON []byte
				requestsJSON, err = common.GetTracers(false)
				if err == nil {
					requests := []types.Request{}
					err = json.Unmarshal(requestsJSON, &requests)
					if err == nil {
						if len(requests) != 0 {
							log.Trace.Printf("Need to parse the following %d requests for tracer strings: %+v", len(requests), requests)
							url := request.Host + request.RequestURI
							tracers := findTracersInResponseBody(string(b), url, requests)
							/* Use the API to add each tracer events to their corresponding tracer. */

							var tracerDataID uint
							if len(tracers) > 0 {
								tracerDataID = common.AddEventData(string(b))
							}

							for _, tracer := range tracers {
								for _, event := range tracer.TracerEvents {
									//TODO: should probably make a bulk add events function
									event.RawEventID = tracerDataID
									_, err = common.AddEvent(tracer, event)
								}
							}

						}
					}
				}
			}

			if err == io.EOF {
				return
			}

			if err != nil {
				if !strings.Contains(err.Error(), "UNIQUE") {
					log.Error.Println(err)
				}
			}
		}
	}()

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
		if err == io.EOF || nb == 0 { // As of golang 1.7, 0-byte-reads don't always return EOF
			break
		}

		if err != nil {
			log.Error.Println(err)
		}

		/* Copy the bytes read above to the other connection. */
		_, err = server.Write(buf[:nb])

		if err != nil {
			/* If there was an error, fail fast. */
			log.Error.Println(err)
			break
		}
	}
}
