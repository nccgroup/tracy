package rest

import (
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/nccgroup/tracy/api/common"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
)

// upgrader is used a configuration struct when upgrading the websocket
// connection.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     checkOrigin,
}

// WebSocket is the websocket handler for the HTTP API. */
func WebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		returnError(w, err)
		return
	}

	key := common.AddSubscriber(conn)
	conn.SetCloseHandler(func(code int, text string) error {
		common.RemoveSubscriber(key)
		return nil
	})

	for {
		var msg []int
		if err := conn.ReadJSON(&msg); err != nil {
			conn.Close()
			return
		}

		// The only data we receive from the client is a number that tells
		// the router the connection only wants to receive updates for that
		// tracer ID.
		if len(msg) == 1 {
			common.ChangeTracer(key, msg[0])
		}
	}
}

// checkOrigin is used to validate the origin header from the incoming HTTP request
// before it is upgraded to a websocket. This function prevents other websites
// from connecting to the websocket.
func checkOrigin(r *http.Request) bool {
	org := r.Header.Get("Origin")
	srv := "http://" + configure.ReadAllConfig()["tracer-server"].(string)

	ourl, err := url.Parse(org)
	if err != nil {
		log.Error.Print(err)
		return false
	}

	surl, err := url.Parse(srv)
	if err != nil {
		log.Error.Print(err)
		return false
	}

	// if there is a match between the Tracy web extension, it's fine.
	if strings.HasSuffix(ourl.Scheme, "-extension") {
		// Hardcoded IDs for tracy mozilla and chrome extensions.
		// Not secrets, just their global extension IDs. We also want to
		// allow connections from debugging websockets since those IDs
		// change every reload.
		if ourl.Hostname() == "lcgbimfijafcjjijgjoodgpblgmkckhn" ||
			ourl.Hostname() == "9d1494b8-e44b-40f7-b4a9-47d47d31b9f2" ||
			configure.DebugUI {
			return true
		}

	}

	org4, err := firstIPv4(ourl.Hostname())
	if err != nil {
		log.Error.Print(err)
		return false
	}
	srv4, err := firstIPv4(surl.Hostname())
	if err != nil {
		log.Error.Print(err)
		return false
	}

	// if there is a match between the configured host and the origin host
	// and they share the same port, it's fine.
	if org4 == srv4 && ourl.Port() == surl.Port() {
		return true
	}

	// if there is a match between the debug server, it's fine.
	if org4 == "127.0.0.1" && ourl.Port() == "3000" {
		return true
	}

	return true
}

// firstIPv4 takes a hostname and returns the first IPv4 resolution of the
// IP addresses.
func firstIPv4(hostname string) (string, error) {
	ips, err := net.LookupHost(hostname)

	if err != nil {
		log.Warning.Print(err)
		return "", err
	}

	if len(ips) <= 0 {
		log.Warning.Print("no hosts resolved in origin check")
		return "", err
	}

	for _, v := range ips {
		ip := net.IP(v)
		if err := ip.To4(); err == nil {
			return string(ip), nil
		}
	}

	return "", fmt.Errorf("no IPv4 addresses found for %s", hostname)
}
