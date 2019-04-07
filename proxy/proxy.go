package proxy

import (
	"bufio"
	"bytes"
	"compress/gzip"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net"
	"net/http"
	"net/http/httptrace"
	"net/http/httputil"
	"net/url"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
)

// Proxy is the object that stores the configured proxy TCP listener
// for the tracy proxy.
type Proxy struct {
	HTTPTransport     http.Transport
	HTTPBufferPool    *sync.Pool
	HTTPBytePool      *sync.Pool
	WebSocketUpgrader websocket.Upgrader
	WebSocketDialer   websocket.Dialer
	APIClient         *http.Client
}

// New instantiates a Proxy object with the passed in net.Listener,
// http.Transport, and websocket.Dialer.
func New(transport http.Transport, upgrader websocket.Upgrader,
	dialer websocket.Dialer, bp, bufp *sync.Pool) *Proxy {

	return &Proxy{
		HTTPTransport:     transport,
		HTTPBufferPool:    bufp,
		HTTPBytePool:      bp,
		WebSocketUpgrader: upgrader,
		WebSocketDialer:   dialer,
		APIClient:         &http.Client{},
	}
}

// identifyRequestsForGenereateTracer is a helper that looks for generated
// tracer payloads that might not have had a request associated with them
// yet. When the proxy finds one, it associates that HTTP request with the
// payload so that there is a record of where the input was sent to the
// server for the fist time.
func (p *Proxy) identifyRequestsforGeneratedTracer(d []byte, method string) {

	req, err := http.NewRequest("GET", "http://"+configure.Current.TracyServer.Addr()+"/api/tracy/tracers", nil) //Change this over to https when we do that. Well it would be better to make it a config
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Hoot", "Hoot")

	resp, err := p.APIClient.Do(req) //because this is a request now we make a lot of request. Really this needs to be websocket but for now it's not a problem

	if err != nil {
		log.Error.Print(err)
		return
	}

	defer resp.Body.Close()

	var requests []types.Request

	err = json.NewDecoder(resp.Body).Decode(&requests)

	dump := string(d)

	for _, req := range requests {
		for _, tracer := range req.Tracers {
			if !strings.Contains(dump, tracer.TracerPayload) ||
				req.RawRequest != "GENERATED" {
				continue
			}
			req.RawRequest = dump
			req.RequestMethod = method

			jsonData, _ := json.Marshal(req)

			req, err := http.NewRequest("PATCH", "http://"+configure.Current.TracyServer.Addr()+"/api/tracy/tracers", bytes.NewBuffer(jsonData)) //Change this over to https when we do that. Well it would be better to make it a config
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Hoot", "Hoot")

			_, err = p.APIClient.Do(req)

			if err != nil {
				log.Error.Print(err)
				return
			}
		}
	}
}

func (p *Proxy) apiRequest(method string, data []byte, endpoint string) (*http.Response, error) {
	req, err := http.NewRequest(method, "http://"+configure.Current.TracyServer.Addr()+endpoint, bytes.NewBuffer(data))
	if err != nil {
		log.Error.Print(err)
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Hoot", "Hoot")

	response, err := p.APIClient.Do(req)

	return response, err
}

// findTracers finds tracer strings in a string.
func (p *Proxy) findTracers(s string, requests []types.Request) ([]types.Tracer, error) {
	// For each of the tracers, look for the tracer's tracer string.
	tracers := make([]types.Tracer, 0)
	for _, request := range requests {
		for _, tracer := range request.Tracers {
			if strings.Contains(s, tracer.TracerPayload) {
				tracer.TracerEvents = []types.TracerEvent{types.TracerEvent{
					TracerID: tracer.ID,
				}}
				tracers = append(tracers, tracer)
			}
		}
	}
	return tracers, nil
}

// createTracersFrom looks for all the registered tracers in a string
// and makes an event for each of them.
/* func (p *Proxy) createTracersFrom(sb, eventType string, reqURL *url.URL) {
	if configure.HostInWhitelist(reqURL.Host) {
		return
	}
	var err error
	requests := common.GetTracersCache()
	if len(requests) == 0 {
		return
	}

	tracers, err := p.findTracers(sb, requests)
	if err != nil {
		log.Error.Print(err)
		return
	}
	if len(tracers) == 0 {
		return
	}

	// We have to do this first so that we can get the ID of the raw event
	// and insert it with the event structure.
	//	rawEvent, err := common.AddEventData(sb)
	//	if err != nil {
	//		log.Error.Print(err)
	//		return
	//	}

	//bulkEvents := types.TracerEventBulk{TracerPayloads: tracers}

	// for _, tracer := range tracers {
	// 	for _, event := range tracer.TracerEvents {
	// 		//TODO: should probably make a bulk add events function
	// 		event.RawEventID = rawEvent.ID
	// 		event.RawEvent = rawEvent
	// 		event.EventURL = reqURL.String()
	// 		event.EventType = eventType

	// 		if err = store.DB.First(&tracer, "id = ?", event.TracerID).Error; err != nil {
	// 			// Don't print errors about the key being unique in the DB.
	// 			if !strings.Contains(err.Error(), "UNIQUE") {
	// 				log.Error.Println(err)
	// 				return
	// 			}
	// 		}
	// 		_, err = common.AddEvent(tracer, event)
	// 		if err != nil {
	// 			if !strings.Contains(err.Error(), "UNIQUE") {
	// 				log.Error.Print(err)
	// 				return
	// 			}
	// 		}
	// 	}
	// }
} */

// handleConnect handles the upgrade requests for 'CONNECT' HTTP requests.
func handleConnect(client net.Conn, r *http.Request) (net.Conn, bool, error) {
	// Try to upgrade the 'CONNECT' request to a TLS connection with
	// the configured certificate.
	c, isHTTPS, err := upgradeConnectionTLS(client, r.URL.Host)
	if err != nil && err != io.EOF {
		log.Warning.Println(err)
		return nil, isHTTPS, err
	}

	return c, isHTTPS, nil
}

// rebuildRequestURL formats a URL after it has been processed
// from http.ReadRequest so that we can use it easier with the backend proxy.
func rebuildRequestURL(scheme, host, port, path, query string, ws, isHTTPS bool) (*url.URL, error) {
	ports := strings.Split(host, ":")
	var hosts string
	if len(ports) == 2 {
		hosts = host
	} else {
		hosts = host + ":" + port
	}

	var paths string
	if query != "" {
		paths = fmt.Sprintf("%s?%s", path, query)
	} else {
		paths = fmt.Sprintf("%s", path)
	}

	if ws {
		if isHTTPS {
			scheme = "wss"
		} else {
			scheme = "ws"
		}
	}

	u, err := url.Parse(scheme + "://" + hosts + paths)
	if err != nil {
		return nil, err
	}

	return u, nil
}

// ServeHTTP handles any HTTP connections to the proxy.
func (p *Proxy) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	// For our requests, we don't really need to worry about the context
	// being canceled because we aren't doing anything that really warrants
	// a graceful shutdown or recovery. So catch when the request is cancelled
	// and silently exit this reqest
	var (
		port    = "80"
		scheme  = "http"
		isHTTPS = false
		err     error
		client  net.Conn
	)
	// If the request method is 'CONNECT', it's either a TLS connection or a
	// websocket.
	if req.Method == http.MethodConnect {
		hj, ok := w.(http.Hijacker)
		if !ok {
			log.Error.Print("webserver doesn't support hijacking")
			http.Error(w, "webserver doesn't support hijacking", http.StatusInternalServerError)
			return
		}

		client, _, err = hj.Hijack()

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		client, isHTTPS, err = handleConnect(client, req)

		if err != nil && err != io.EOF {
			log.Error.Print(err)
			return
		}
		if client == nil {
			return
		}

		if isHTTPS {
			port = "443"
			scheme = "https"
		}

		req, err = http.ReadRequest(bufio.NewReader(client))
		if err != nil && err != io.EOF {
			log.Error.Print(err)
			return
		}
		if req == nil {
			return
		}
		// ReadRequest doesn't properly build the request object from a raw socket
		// by itself, so we need to ammend some of the fields so we can use them
		// later.
		req.URL, err = rebuildRequestURL(scheme, req.Host, port, req.URL.Path,
			req.URL.RawQuery, req.Header.Get("Upgrade") == "websocket", isHTTPS)
		if err != nil {
			log.Error.Print(err)
			return
		}
		if client != nil {
			defer client.Close()
		}
	}

	// Requests with the custom HTTP header "X-TRACY" are opting out of the
	// swapping of tracy payloads. Also, we keep a whitelist of hosts that
	// shouldn't swap out tracy payloads so that recursion issues don't
	// happen. For example, tracy payloads will occur all over the UI and
	// we don't want those to be swapped.
	if configure.HostInWhitelist(req.URL.Host) || req.Header.Get("X-TRACY") != "" {
		p.serve(client, isHTTPS, w, req)
		return
	}

	dump := p.HTTPBytePool.Get().([]byte)
	clear(dump)
	dump, err = httputil.DumpRequest(req, true)
	if err != nil {
		log.Error.Print(err)
		p.HTTPBytePool.Put(dump)
		return
	}

	// Same here. We can't use buffer pool because copy will take the smallest
	// len of the buffers and only copy that many bytes. Need them all and
	// we don't know how many there are ahead of time.
	dumpc := make([]byte, len(dump))
	copy(dumpc, dump)

	// Look for tracers that might have been generated out-of-band
	// using the API. Do this by checking if there exists a tracer,
	// but we have no record of which request it came from.
	go p.identifyRequestsforGeneratedTracer(dumpc, req.Method)

	// Search through the request for the tracer keyword.
	var tracers []types.Tracer
	dump, tracers = replaceTracerStrings(dump)
	req, err = http.ReadRequest(bufio.NewReader(bytes.NewReader(dump)))

	if err != nil && err != io.EOF {
		log.Error.Print(err)
		p.HTTPBytePool.Put(dump)
		return
	}

	// ReadRequest doesn't properly build the request object from a raw socket
	// by itself, so we need to ammend some of the fields so we can use them
	// later.
	req.URL, err = rebuildRequestURL(scheme, req.Host, port, req.URL.Path,
		req.URL.RawQuery, req.Header.Get("Upgrade") == "websocket", isHTTPS)
	if err != nil {
		log.Error.Print(err)
		p.HTTPBytePool.Put(dump)
		return
	}

	// Check if the host is the tracer API server. We don't want to
	// trigger anything if we accidentally proxied a tracer server
	// API call because it will cause a recursion.
	if !configure.HostInWhitelist(req.URL.Host) && len(tracers) > 0 {
		go func() {
			defer p.HTTPBytePool.Put(dump)
			r := types.Request{
				RawRequest:    string(dump),
				RequestURL:    req.Host + req.RequestURI,
				RequestMethod: req.Method,
				Tracers:       tracers,
			}

			//_, err = common.AddTracer(r)
			jsonData, _ := json.Marshal(r)

			req, err := http.NewRequest("POST", "http://"+configure.Current.TracyServer.Addr()+"/api/tracy/tracers", bytes.NewBuffer(jsonData)) //Change this over to https when we do that. Well it would be better to make it a config
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Hoot", "Hoot")

			_, err = p.APIClient.Do(req)

			if err != nil {
				log.Error.Print(err)
			}
		}()
	}

	// Dump the request structure as a slice of bytes.
	if log.Verbose {
		dump, _ := httputil.DumpRequest(req, true)
		log.Trace.Println(string(dump))
	}

	p.serve(client, isHTTPS, w, req)
}

func clear(b []byte) {
	b = b[:0]
}

func (p *Proxy) serve(client net.Conn, isHTTPS bool, w http.ResponseWriter, req *http.Request) {
	if strings.HasPrefix(req.Header.Get("X-TRACY"), "GET-CACHE") {
		err := p.serveFromCache(w, req)

		if err != nil && err != io.EOF {
			log.Error.Print(err)
			return
		}
	} else if strings.HasPrefix(req.URL.Scheme, "ws") && client == nil {
		err := p.serveFromWebSocket(w, req)

		if err != nil && err != io.EOF {
			log.Error.Print(err)
			return
		}
	} else if strings.HasPrefix(req.URL.Scheme, "ws") && client != nil {
		err := p.serveFromWebSocketWithClient(client, req)

		if err != nil && err != io.EOF {
			log.Error.Print(err)
			return
		}
	} else if client != nil {
		err := p.serveFromHTTP(client, req)

		if err != nil && err != io.EOF {
			log.Error.Print(err)
			return
		}
	} else {
		err := p.serveFromHTTP(w, req)

		if err != nil && err != io.EOF {
			log.Error.Print(err)
			return
		}
	}

}

// serveFromWebSocket connects to the backend websocket by computing the
// websocket key, finishing the websocket handshake with the frontend
// and bridge the two socket connections so they are passing data to each
// other.
func (p *Proxy) serveFromWebSocket(w http.ResponseWriter, req *http.Request) error {
	client, err := p.WebSocketUpgrader.Upgrade(w, req, nil)

	if client != nil {
		defer client.Close()

	}

	if err != nil {
		log.Error.Print(err)
		return err
	}

	// Gorilla doesn't like to have duplicate headers.
	req.Header.Del("Sec-Websocket-Version")
	req.Header.Del("Sec-Websocket-Extensions")
	req.Header.Del("Sec-Websocket-Key")
	req.Header.Del("Connection")
	req.Header.Del("Upgrade")

	// Make sure to copy cookies into the websocket handshake. This is how many
	// will authenticate the connection.
	server, _, err := p.WebSocketDialer.Dial(req.URL.String(), req.Header)

	if server != nil {
		defer server.Close()

	}

	if err != nil {
		log.Error.Print(err)
		return err
	}

	// Bridge the sockets together and send bytes to eachother. bridge
	// will block until the websocket is closed.
	s := server.UnderlyingConn()
	c := client.UnderlyingConn()
	go p.bridge(c, s, true, req)
	p.bridge(s, c, false, req)
	return nil
}

// serveFromWebSocket connects to the backend websocket by computing the
// websocket key, finishing the websocket handshake with the frontend
// and bridge the two socket connections so they are passing data to each
// other.
const magicString string = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

func (p *Proxy) serveFromWebSocketWithClient(c net.Conn, req *http.Request) error {
	h := req.Header.Get("sec-websocket-key")
	// Gorilla doesn't like to have duplicate headers.
	req.Header.Del("Sec-Websocket-Version")
	req.Header.Del("Sec-Websocket-Extensions")
	req.Header.Del("Sec-Websocket-Key")
	req.Header.Del("Connection")
	req.Header.Del("Upgrade")

	// Make sure to copy cookies into the websocket handshake. This is how many
	// will authenticate the connection.
	server, _, err := p.WebSocketDialer.Dial(req.URL.String(), req.Header)
	if server != nil {
		defer server.Close()
	}

	if err != nil {
		log.Error.Print(err)
		return err
	}

	b := p.HTTPBytePool.Get().([]byte)
	clear(b)
	defer p.HTTPBytePool.Put(b)

	hash := sha1.Sum([]byte(h + magicString))
	b = []byte("HTTP/1.1 101 Web Socket Protocol Handshake\r\n" +
		"Upgrade: WebSocket\r\n" +
		"Connection: Upgrade\r\n" +
		"Sec-WebSocket-Accept: " + base64.StdEncoding.EncodeToString(hash[:]) + "\r\n" +
		"\r\n")

	c.Write(b)

	// Bridge the sockets together and send bytes to eachother. bridge
	// will block until the websocket is closed.
	s := server.UnderlyingConn()
	go p.bridge(c, s, true, req)
	p.bridge(s, c, false, req)
	return nil
}

// serveFromCache serves a request from Tracy's local cache instead of making
// a network request
func (p *Proxy) serveFromCache(w http.ResponseWriter, req *http.Request) error {
	e := strings.Split(req.Header.Get("X-TRACY"), ";")
	if len(e) != 2 {
		err := fmt.Errorf(`incorrect usage of GET-CACHE header. expected "GET-CACHE;<BASE64(EXPLOIT:TRACERSTRING)>"`)
		return err
	}

	// So that we don't have to keep state in the proxy, encode the
	// tracer string to replace and the exploit in the header.
	et := p.HTTPBytePool.Get().([]byte)
	clear(et)
	var err error
	defer p.HTTPBytePool.Put(et)
	et, err = base64.StdEncoding.DecodeString(e[1])
	if err != nil {
		return err
	}

	ent := strings.Split(string(et), "--")
	if len(ent) != 2 {
		err := fmt.Errorf(`incorrect usage of GET-CACHE header. expected "GET-CACHE;<BASE64(EXPLOIT:TRACERSTRING)>"`)
		return err
	}
	b := p.HTTPBytePool.Get().([]byte)
	clear(b)
	b, err = getCachedResponse(req.URL.String(), req.Method)
	if err != nil {
		// Can't recover from this. Return something so the tab will close.
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return err
	}

	// Swap out the tracer string with the exploit.
	b = bytes.Replace(b, []byte(ent[1]), []byte(ent[0]), 1)
	resp, err := http.ReadResponse(bufio.NewReader(bytes.NewReader(b)), req)

	if resp != nil {
		defer resp.Body.Close()
	}

	if err != nil {
		return err
	}

	writeBack(w, resp, b)
	return nil
}

// serveFromHTTP connects to a backend server, sends the
// proxied request, and reads the response as a slice of bytes.
func (p *Proxy) serveFromHTTP(w io.Writer, req *http.Request) error {
	// If we are prepping the cache, remove any cache headers.
	prepingCache := strings.EqualFold(req.Header.Get("X-TRACY"), "set-cache")
	if prepingCache {
		req.Header.Del("If-None-Match")
		req.Header.Del("Etag")
		req.Header.Del("Cache-Control")
	}

	if configure.Current.LogReusedHTTPConnections {
		trace := &httptrace.ClientTrace{
			GotConn: func(connInfo httptrace.GotConnInfo) {
				if connInfo.Reused {
					fmt.Printf("Connection to %s was reused: %+v\n", req.URL.String(), connInfo)
				}
			},
		}
		req = req.WithContext(httptrace.WithClientTrace(req.Context(), trace))
	}

	// In the case where we build the request from a CONNECT upgrade,
	// if we manually set this header, the body won't be transparently
	// gziped when we read from body.
	req.Header.Del("Accept-Encoding")
	ctx := req.Context()
	c := make(chan error, 1)
	var resp *http.Response
	var err error
	save := p.HTTPBufferPool.Get().(*bytes.Buffer)
	b := p.HTTPBytePool.Get().([]byte)
	clear(b)
	save.Reset()
	defer p.HTTPBufferPool.Put(save)
	defer p.HTTPBytePool.Put(b)

	go func() {
		resp, err = p.HTTPTransport.RoundTrip(req)

		if resp != nil {
			defer resp.Body.Close()
		}

		if err != nil {
			writeErr(w, err)
			c <- err
			return
		}

		b, err = ioutil.ReadAll(io.TeeReader(resp.Body, save))
		if err != nil {
			c <- err
			return
		}

		c <- nil
	}()
	select {
	case <-ctx.Done():
		<-c
		if err := ctx.Err(); err != nil {
			// This is likely the request being canceled by the context.
			// Only warn here, don't proceed and report no errors.
			log.Warning.Print(err)
			return nil
		}
	case err := <-c:
		if err != nil {
			return err
		}
	}

	resp.Body = ioutil.NopCloser(save)
	// If the request has the X-TRACY: SET-CACHE value, make sure
	// we cache this response.
	if prepingCache {
		// If we are prepping the cache, create a copy of the
		// response so we can work with it on our own without
		// slowing up the proxy.
		respb := p.HTTPBytePool.Get().([]byte)
		clear(respb)
		respb, err = httputil.DumpResponse(resp, true)
		if err != nil {
			log.Error.Print(err)
			return err
		}

		go p.prepCache(respb, req.URL, req.Method)
	} else {
		// Search for any known tracers in the response. Since the list of tracers
		// might get large, perform this operation in a goroutine.
		// The proxy can finish this connection before this finishes.
		// We don't need to do this in the cases where we are prepping the cache.
		//go p.createTracersFrom(string(b), "http response", req.URL)
	}

	writeBack(w, resp, b)
	return nil
}

func writeErr(w io.Writer, err error) {
	switch rw := w.(type) {
	case http.ResponseWriter:
		http.Error(rw, err.Error(), http.StatusInternalServerError)
	case net.Conn:
		rw.Write([]byte(err.Error()))
	}
}

func writeBack(w io.Writer, resp *http.Response, b []byte) {
	switch rw := w.(type) {
	case http.ResponseWriter:
		for k, v := range resp.Header {
			rw.Header().Set(k, v[0])
		}
		rw.WriteHeader(resp.StatusCode)
		rw.Write(b)
	case net.Conn:
		resp.Write(rw)
	}
}

// prepCache processes a copy of the HTTP response so that it is uncompressed
// and unchunked before storing it in the cache. This makes it easier for us
// to swap out the payloads.
func (p *Proxy) prepCache(respbc []byte, reqURL *url.URL, method string) {
	defer p.HTTPBytePool.Put(respbc)
	resp, err := http.ReadResponse(bufio.NewReader(bytes.NewReader(respbc)), nil)
	if resp != nil {
		defer resp.Body.Close()
	}
	if err != nil && err != io.EOF {
		log.Error.Print(err)
		return
	}

	// NOTE: ioutil.ReadAll handles all the chunking.
	b := p.HTTPBytePool.Get().([]byte)
	clear(b)
	defer p.HTTPBytePool.Put(b)

	b, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Error.Print(err)
		return
	}
	//...but we still need to modify our cached HTTP response properly.
	resp.TransferEncoding = []string{}

	// Check that the server actually sent compressed data.
	if strings.EqualFold(resp.Header.Get("Content-Encoding"), "gzip") {
		gr, err := gzip.NewReader(bytes.NewReader(b))
		if err != nil && err != io.EOF {
			log.Error.Print(err)
			return
		}

		if gr == nil {
			return
		}

		defer gr.Close()
		b, err = ioutil.ReadAll(gr)

		if err != nil {
			log.Error.Print(err)
			return
		}
	}
	//...and update the body and content length after normalizing
	// chunking and compression.
	resp.Body = ioutil.NopCloser(bytes.NewBuffer(b))
	resp.ContentLength = int64(len(b))
	resp.Header.Del("Content-Encoding")
	respb := p.HTTPBytePool.Get().([]byte)
	clear(respb)
	defer p.HTTPBytePool.Put(respb)
	respb, err = httputil.DumpResponse(resp, true)

	if err != nil {
		log.Error.Print(err)
		return
	}

	setCacheResponse(reqURL, method, respb)
}

// cacheResponse adds a cache entry in the proxy cache for the HTTP response
// corresponding to the method and URL. This happens only if the request
// has been marked with the HTTP request header SET-CACHE.
func setCacheResponse(reqURL *url.URL, method string, resp []byte) {
	r := &requestCacheSet{
		url:    reqURL.String(),
		method: method,
		resp:   resp,
	}

	requestCacheSetChan <- r
}

// getCachedResponse gets a cache entry from the proxy cache based on a
// request method and URL. This happens only if the request has been marked
// with the HTTP request header FROM-CACHE.
func getCachedResponse(url, method string) ([]byte, error) {
	r := &requestCacheGet{
		url:    url,
		method: method,
		ok:     make(chan bool),
		resp:   make(chan []byte),
	}
	requestCacheGetChan <- r
	if ok := <-r.ok; !ok {
		// Collecting the resp so that it is clear for the next cache request.
		<-r.resp
		err := fmt.Errorf("The request didn't have a cache entry")
		log.Warning.Print(err)
		return []byte{}, err
	}

	return <-r.resp, nil

}

// bridge reads bytes from one connection and writes them to another connection.
// TODO: add code to look for tracy payloads in websockets so that
// we can identify when sources of input include data coming from the server in
// websocket.isLeft is the bool to indicate which side of the bride. If isLeft
// is true, this is the side connecting to the web app and vice versa.
func (p *Proxy) bridge(src, dst net.Conn, isLeft bool, req *http.Request) {
	b := p.WebSocketUpgrader.WriteBufferPool.Get().([]byte)
	clear(b)
	defer p.WebSocketUpgrader.WriteBufferPool.Put(b)

	var err error
	var nb int
	//	var tracers []types.Tracer
	for {
		nb, err = src.Read(b)
		// As of golang 1.7, 0-byte-reads don't always return EOF
		if err == io.EOF || nb == 0 {
			break
		}
		if err != nil {
			log.Error.Print(err)
		}

		// Depending on which side of the bridge it is, either replace
		// tracer strings or log events from tracer strings.
		//TODO: something is off with this
		/*		if isLeft {
					b, tracers = replaceTracerStrings(b)
					sb := string(b)
					go func() {
						r := types.Request{
							RawRequest:    sb,
							RequestMethod: "websocket",
							Tracers:       tracers,
						}

						_, err = common.AddTracer(r)
						if err != nil {
							log.Error.Print(err)
						}
					}()
				} else {
					go p.createTracersFrom(string(b), "websocket", req.URL)
				}*/

		_, err = dst.Write(b[:nb])

		if err != nil {
			log.Error.Print(err)
			break
		}
	}

}
