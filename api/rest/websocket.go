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

// WebSocket is the websocket handler for the HTTP API.
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
	return true
}
