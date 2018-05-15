package rest

import (
	"github.com/gorilla/websocket"
	"net/http"
	"tracy/api/common"
	"tracy/log"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     checkOrigin,
}

/*WebSocket is the websocket handler for our API. */
func WebSocket(w http.ResponseWriter, r *http.Request) {
	log.Error.Println("hit websocket")
	var err error
	var conn *websocket.Conn
	if conn, err = upgrader.Upgrade(w, r, nil); err == nil {
		log.Error.Println("upgraded the socket")
		key := common.AddSubscriber(conn)
		conn.SetCloseHandler(func(code int, text string) error {
			log.Error.Printf("Closing the socket: %s", text)
			common.RemoveSubscriber(key)
			return nil
		})

		for {
			var msg []int
			if err = conn.ReadJSON(&msg); err == nil {
				log.Error.Printf("Message from socket: %+v", msg)
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
	log.Error.Println("checking the origin")
	return true
}
