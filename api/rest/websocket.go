package rest

import (
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/nccgroup/tracy/api/common"
)

// upgrader is used a configuration struct when upgrading the websocket
// connection.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	WriteBufferPool: &sync.Pool{
		New: func() interface{} {
			return make([]byte, 1024*4)
		},
	},
	CheckOrigin: checkOrigin,
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
// from connecting to the websocket. TODO: does this really matter?
func checkOrigin(r *http.Request) bool {
	/*	org := r.Header.Get("Origin")
		if org == "" {
			return true
		}

		ourl, err := url.Parse(org)
		if err != nil {
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
				configure.Current.DebugUI {
				return true
			}

			return false

		}

		if ourl.Hostname() == "localhost" || ourl.Hostname() == "127.0.0.1" {
			p, err := strconv.ParseUint(ourl.Port(), 10, 32)
			if err != nil {
				return false
			}
			if uint(p) == configure.Current.TracyServer.Port {
				return true
			}

			for _, v := range configure.Current.ServerWhitelist {
				if uint(p) == v.Port {
					return true
				}
			}

		}

		return false*/
	return true
}
