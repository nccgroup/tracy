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
	"sync"

	"github.com/nccgroup/tracy/api/common"
	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
)

var bufferPool = sync.Pool{
	New: func() interface{} {
		return make([]byte, 1024*4)
	},
}

// Proxy is the object that stores the configured proxy TCP listener
// for the tracy proxy.
type Proxy struct {
	Listener net.Listener
}

// Accept is the wrapper function for accepting TCP connections for
// the proxy.
func (p *Proxy) Accept() {
	for {
		conn, err := p.Listener.Accept()
		if err != nil {
			log.Error.Println(err)
			continue
		}

		go handleConnection(conn)
	}

}

// New instantiates a Proxy object with the passed in net.Listener.
func New(listener net.Listener) *Proxy {
	return &Proxy{
		Listener: listener,
	}
}

// identifyRequestsForGenereateTracer is a helper that looks for generated
// tracer payloads that might not have had a request associated with them
// yet. When the proxy finds one, it associates that HTTP request with the
// payload so that there is a record of where the input was sent to the
// server for the fist time.
func identifyRequestsforGeneratedTracer(dump, method string) {
	// TODO: probably should change this to a websocket notifier so that we
	// don't have to do this database lookup.
	tracersBytes, err := common.GetTracers()
	if err != nil {
		log.Error.Print(err)
		return
	}

	var requests []types.Request
	err = json.Unmarshal(tracersBytes, &requests)
	if err != nil {
		log.Error.Print(err)
		return
	}

	for _, req := range requests {
		for _, tracer := range req.Tracers {
			if !strings.Contains(dump, tracer.TracerPayload) ||
				req.RawRequest != "GENERATED" {
				continue
			}
			req.RawRequest = dump
			req.RequestMethod = method

			err = store.DB.Save(&req).Error
			if err != nil {
				log.Error.Print(err)
				return
			}
			common.UpdateSubscribers(req)
		}
	}
}

// identifyTracersInResponse looks for all the registered tracers in an HTTP
// response and makes an event for each of them.
func identifyTracersInResponse(b []byte, host string, request *http.Request, resp *http.Response) {
	// Check if the host is the tracer API server. We don't want to trigger
	// anything if we accidentally proxied a tracer server API call because
	// it will cause a recursion.
	if configure.ServerInWhitelist(host) {
		return
	}

	// Check that the server actually sent compressed data
	if resp.Header.Get("Content-Encoding") == "gzip" {
		reader, err := gzip.NewReader(bytes.NewReader(b))
		if err == io.EOF {
			return
		}
		if err != nil {
			log.Error.Print(err)
			return
		}

		if reader == nil {
			return
		}

		defer reader.Close()
		b, err = ioutil.ReadAll(reader)

	}

	requestsJSON, err := common.GetTracers()
	if err != nil {
		log.Error.Print(err)
		return
	}

	var requests []types.Request
	err = json.Unmarshal(requestsJSON, &requests)
	if err != nil {
		log.Error.Print(err)
		return
	}

	if len(requests) == 0 {
		return
	}

	url := request.Host + request.RequestURI
	tracers := findTracersInResponseBody(string(b), url, requests)

	if len(tracers) == 0 {
		return
	}

	// We have to do this first so that we can get the ID of the raw event
	// and insert it with the event structure.
	rawEvent, err := common.AddEventData(string(b))
	if err != nil {
		log.Error.Print(err)
		return
	}

	for _, tracer := range tracers {
		for _, event := range tracer.TracerEvents {
			//TODO: should probably make a bulk add events function
			event.RawEventID = rawEvent.ID
			event.RawEvent = rawEvent

			if err = store.DB.First(&tracer, "id = ?", event.TracerID).Error; err != nil {
				// Don't print errors about the key being unique in the DB.
				if !strings.Contains(err.Error(), "UNIQUE") {
					log.Error.Println(err)
					return
				}
			}
			_, err = common.AddEvent(tracer, event)
			if err != nil {
				log.Error.Print(err)
				return
			}
		}
	}
}

// handleConnect handles the upgrade requests for 'CONNECT' HTTP requests.
func handleConnect(client net.Conn, request *http.Request, host string) (net.Conn, *http.Request, bool, error) {
	// Try to upgrade the 'CONNECT' request to a TLS connection with
	// the configured certificate.
	c, isHTTPS, err := upgradeConnectionTLS(client, host)
	if err != nil {
		log.Warning.Println(err)
		return nil, nil, false, err
	}

	// After the connection has been upgraded, reread the request
	// structure over TLS.
	request, err = http.ReadRequest(bufio.NewReader(c))

	if err != nil {
		log.Warning.Println(err)
		return nil, nil, false, err
	}

	// Read the request structure as a slice of bytes.
	if log.Verbose {
		dump, err := httputil.DumpRequest(request, true)
		if err != nil {
			log.Warning.Println(err)
			return nil, nil, false, err
		}

		log.Trace.Print(string(dump))
	}

	return c, request, isHTTPS, nil
}

// handleConnection handles any TCP connections to the proxy. Client refers to
// the client making the connection to the proxy. Server refers to the actual
// server they are attempting to connect to after going through the proxy.
func handleConnection(client net.Conn) {
	// Read a request structure from the TCP connection.
	request, err := http.ReadRequest(bufio.NewReader(client))
	if err == io.EOF {
		return
	}
	if err != nil {
		log.Error.Print(err)
		return
	}

	host := request.URL.Host
	isHTTPS := false

	// Dump the request structure as a slice of bytes.
	if log.Verbose {
		dump, _ := httputil.DumpRequest(request, true)
		log.Trace.Println(string(dump))
	}

	// If the request method is 'CONNECT', it's either a TLS connection or a
	// websocket.
	if request.Method == http.MethodConnect {
		client, request, isHTTPS, err = handleConnect(client, request, host)
		if err == io.EOF {
			return
		}
		if err != nil {
			log.Error.Print(err)
			return
		}
	}

	// Moving the client close here for the same reason as request, above.
	if client != nil {
		defer client.Close()
	}

	// Requests with the custom HTTP header "X-TRACY" are opting out of the
	// swapping of tracy payloads. Also, we keep a whitelist of hosts that
	// shouldn't swap out tracy payloads so that recursion issues don't
	// happen. For example, tracy payloads will occur all over the UI and
	// we don't want those to be swapped.
	if !configure.ServerInWhitelist(host) && request.Header.Get("X-TRACY") == "" {
		// Look for tracers that might have been generated out of band
		// using the API. Do this by checking if there exists a tracer,
		// but we have no record of which request it came from.
		dump, err := httputil.DumpRequest(request, true)
		if err != nil {
			log.Error.Print(err)
			return
		}

		go identifyRequestsforGeneratedTracer(string(dump), request.Method)

		// Search through the request for the tracer keyword.
		tracers, err := replaceTracers(request)

		if err != nil {
			log.Error.Println(err)
			return
		}

		// Check if the host is the tracer API server. We don't want to
		// trigger anything if we accidentally proxied a tracer server
		// API call because it will cause a recursion.
		if !configure.ServerInWhitelist(host) && len(tracers) > 0 {
			go func() {
				// Have to do this again because we changed the
				// contents of the request and the request object
				// is a pointer.
				dump, err := httputil.DumpRequest(request, true)
				if err != nil {
					log.Error.Print(err)
					return
				}

				req := types.Request{
					RawRequest:    string(dump),
					RequestURL:    request.Host + request.RequestURI,
					RequestMethod: request.Method,
					Tracers:       tracers,
				}

				_, err = common.AddTracer(req)
				if err != nil {
					log.Error.Print(err)
				}
			}()
		}
	}

	var server net.Conn

	// Based on the scheme, the API is different to backside of the proxy connection.
	// TODO: I think we can change the default transport here to timeout a
	// bit faster and to reuse connections.
	if !isHTTPS {
		if strings.Index(host, ":") == -1 {
			server, err = net.Dial("tcp", host+":80")
		} else {
			server, err = net.Dial("tcp", host)
		}

		if server != nil {
			defer server.Close()
		}

		if err != nil {
			log.Error.Println(err)
			return
		}
	} else {
		var tserver *tls.Conn
		// If the scheme is HTTPS, need to the use the tls package to
		// make the dial. We also don't care about insecure connections
		// when using tracy. A lot the apps we are testing use dev or
		// QA environments with self-signed certificates.
		tserver, err = tls.Dial("tcp", host, &tls.Config{
			InsecureSkipVerify: true,
		})

		// Have to check for nil differently with tls.Dial because it
		// returns a pointer of a connection instead of a struct.
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

	// Write the entire request to the backside connection of the proxy.
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

	// Search for any known tracers in the response. Since the list of tracers
	// might get large, perform this operation in a goroutine.
	// The proxy can finish this connection before this finishes.
	go identifyTracersInResponse(b, host, request, resp)

	// Right the response back to the client.
	resp.Body = ioutil.NopCloser(&save)
	resp.Write(client)

	// If the backside of the proxy tries to change the protocol, forward
	// this change and simply copy the bytes between the two connections
	//until they are finished.
	if resp.StatusCode == http.StatusSwitchingProtocols {
		// Bridge blocks until the connections are finished talking, so
		// client-to-server communication needs to be in its own goroutine.
		go bridge(client, server)
		// Block on server-to-client communication until both connections
		// are finished.
		bridge(server, client)
	}
}

// bridge reads bytes from one connection and writes them to another connection.
// TODO: add code to look for tracy payloads in websockets so that
// we can identify when sources of input include data coming from the server in
// websocket.
func bridge(client net.Conn, server net.Conn) {
	buf := bufferPool.Get().([]byte)
	for {
		if _, err := io.CopyBuffer(client, server, buf); err != nil {
			log.Error.Println(err)
			break
		}
	}
	bufferPool.Put(buf)
}
