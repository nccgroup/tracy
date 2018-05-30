package rest

import (
	"github.com/gorilla/websocket"
	"github.com/nccgroup/tracy/api/common"
	"github.com/nccgroup/tracy/log"
	"net/http"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     checkOrigin,
}

/*WebSocket is the websocket handler for our API. */
func WebSocket(w http.ResponseWriter, r *http.Request) {
	var err error
	var conn *websocket.Conn
	if conn, err = upgrader.Upgrade(w, r, nil); err == nil {
		key := common.AddSubscriber(conn)
		conn.SetCloseHandler(func(code int, text string) error {
			common.RemoveSubscriber(key)
			return nil
		})

		for {
			var msg []int
			if err = conn.ReadJSON(&msg); err == nil {
				if len(msg) == 1 {
					common.ChangeTracer(key, msg[0])
				}
			} else {
				conn.Close()
				break
			}
		}

	}

	if err != nil {
		log.Error.Println(err)
	}

}

func checkOrigin(r *http.Request) bool {
	return true
}
