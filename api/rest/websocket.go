package rest

import (
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/nccgroup/tracy/api/common"
	"github.com/nccgroup/tracy/log"
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

	var key string
	key, err = common.AddSubscriber(conn)
	if err != nil {
		log.Error.Print(err)
		conn.Close()
		return
	}
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
	}
}

// checkOrigin is used to validate the origin header from the incoming HTTP request
// before it is upgraded to a websocket. This function prevents other websites
// from connecting to the websocket. TODO: does this really matter?
func checkOrigin(r *http.Request) bool {
	return true
}
