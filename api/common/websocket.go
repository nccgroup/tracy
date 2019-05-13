package common

import (
	"fmt"

	"github.com/gorilla/websocket"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/log"
)

var (
	subscribers   map[string]*subscriber
	updateChan    chan *update
	addSubChan    chan *subscriber
	changeSubChan chan []int
	removeSubChan chan string
)

type update struct {
	Key  string
	Data interface{}
}

// subscriber is a struct used to keep track of client connections to the router.
// A subscriber has a key index, the tracer it is currently listening to and the
// websocket connection that manages it.
type subscriber struct {
	Key    string
	Sock   *websocket.Conn
	Tracer uint
}

// AddSubscriber takes a websocket connection and adds it to the list of subscribers.
// New events that happen in package common get pushed these events.
func AddSubscriber(conn *websocket.Conn) (string, error) {
	// The first message they send needs to be their UUID.
	var msg []string
	if err := conn.ReadJSON(&msg); err != nil {
		conn.Close()
		return "", err
	}
	if len(msg) != 1 {
		return "", fmt.Errorf("websocket expected an array with the first element a UUID")
	}
	addSubChan <- &subscriber{msg[0], conn, 0}
	return msg[0], nil
}

// RemoveSubscriber removes the websocket from the list of subscribers.
func RemoveSubscriber(key string) {
	removeSubChan <- key
}

// UpdateSubscribers sends an update to all the subscribers.
func UpdateSubscribers(key string, data interface{}) {
	updateChan <- &update{key, data}
}

// Router is a single goroutine used to serialize notifications to each of the
// connected websocket clients. It handles adding and removing a subscriber, changing
// what tracer the subscriber is listening to and and updates to that tracer.
func router() {
	for {
		select {
		case add := <-addSubChan:
			subscribers[add.Key] = add
		case remove := <-removeSubChan:
			delete(subscribers, remove)
		case update := <-updateChan:
			updateRouter(update)
		}
	}
}

func updateRouter(update *update) {
	for _, sub := range subscribers {
		// Only send updates to the subscriber with the matching key.
		if sub.Key != update.Key {
			continue
		}
		switch u := update.Data.(type) {
		case types.Tracer:
			//			log.Error.Printf("here!! %+v", u)
			if err := sub.Sock.WriteJSON(types.TracerWebSocket{u}); err != nil {
				log.Error.Print(err)
				continue
			}
		case types.Request:
			if err := sub.Sock.WriteJSON(types.RequestWebSocket{u}); err != nil {
				log.Error.Print(err)
				continue
			}
		case types.TracerEvent:
			// Only send event updates for the subscribed tracer.
			if u.TracerID == sub.Tracer {
				if err := sub.Sock.WriteJSON(types.TracerEventsWebSocket{u}); err != nil {
					log.Error.Print(err)
					continue
				}
			}
		case types.Notification:
			if err := sub.Sock.WriteJSON(types.NotificationWebSocket{u}); err != nil {
				log.Error.Print(err)
				continue
			}
			/*		case types.Reproduction:
					if err := sub.Sock.WriteJSON(types.ReproductionWebSocket{u}); err != nil {
						log.Error.Print(err)
						continue
					}*/
		default:
			log.Error.Printf("not sure what it was: %T", u)
			continue
		}
	}

}

func init() {
	updateChan = make(chan *update, 10)
	addSubChan = make(chan *subscriber, 10)
	removeSubChan = make(chan string, 10)
	subscribers = make(map[string]*subscriber, 25)
	go router()
}
