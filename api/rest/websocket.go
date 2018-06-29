package rest

import (
	"github.com/gorilla/websocket"
	"github.com/nccgroup/tracy/api/common"
	"github.com/nccgroup/tracy/configure"
	"github.com/nccgroup/tracy/log"
	"net"
	"net/http"
	"net/url"
	"strings"
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
	origin := r.Header.Get("Origin")
	conf := configure.ReadAllConfig()
	srv := conf["tracer-server"].(string)
	srvs := strings.Split(srv, ":")
	if len(srvs) != 2 {
		return false
	}
	url, err := url.Parse(origin)
	if err != nil {
		log.Error.Print(err)
		return false
	}

	// Resolve the hostname from the origin.
	origina, err := net.LookupHost(url.Hostname())
	var origin4 string
	if len(origina) == 2 {
		origin4 = origina[1]
	} else {
		origin4 = origina[0]
	}

	if err != nil {
		log.Error.Print(err)
		return false
	}
	// Resolve the hostname from the configuration file.
	confa, err := net.LookupHost(srvs[0])
	if err != nil {
		log.Error.Print(err)
		return false
	}
	var conf4 string
	if len(confa) == 2 {
		conf4 = confa[1]
	} else {
		conf4 = confa[0]
	}

	// if there is a match between the configured host and the origin host and they share the same port, it's fine
	// if there is a match between the debug server, it's fine.
	if origin4 == conf4 && string(srv[1]) == url.Port() ||
		origin4 == "127.0.0.1" && url.Port() == "3000" {
		return true
	}

	return false
}
