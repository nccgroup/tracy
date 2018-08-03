package common

import (
	"github.com/gorilla/websocket"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/log"
)

var (
	subscribers   map[int]*subscriber
	updateChan    chan interface{}
	addSubChan    chan *subscriber
	changeSubChan chan []int
	removeSubChan chan int
)

// subscriber is a struct used to keep track of client connections to the router.
// A subscriber has a key index, the tracer it is currently listening to and the
// websocket connection that manages it.
type subscriber struct {
	KeyChan chan int
	Sock    *websocket.Conn
	Tracer  uint
}

// AddSubscriber takes a websocket connection and adds it to the list of subscribers.
// New events that happen in package common get pushed these events.
func AddSubscriber(conn *websocket.Conn) int {
	c := make(chan int, 1)
	addSubChan <- &subscriber{c, conn, 0}
	return <-c
}

// RemoveSubscriber removes the websocket from the list of subscribers.
func RemoveSubscriber(key int) {
	removeSubChan <- key
}

// ChangeTracer changes the tracer to send event updates for.
func ChangeTracer(key, tracer int) {
	changeSubChan <- []int{key, tracer}
}

// UpdateSubscribers sends an update to all the subscribers.
func UpdateSubscribers(update interface{}) {
	updateChan <- update
}

// Router is a single goroutine used to serialize notifications to each of the
// connected websocket clients. It handles adding and removing a subscriber, changing
// what tracer the subscriber is listening to and and updates to that tracer.
func router() {
	id := 0

	for {
		select {
		case change := <-changeSubChan:
			subscribers[change[0]].Tracer = uint(change[1])
		case add := <-addSubChan:
			subscribers[id] = add
			add.KeyChan <- id
			id++
		case remove := <-removeSubChan:
			delete(subscribers, remove)
		case update := <-updateChan:
			for _, sub := range subscribers {
				switch u := update.(type) {
				case types.Tracer:
					if err := sub.Sock.WriteJSON(types.TracerWebSocket{u}); err != nil {
						log.Error.Println(err)
						continue
					}
				case types.Request:
					if err := sub.Sock.WriteJSON(types.RequestWebSocket{u}); err != nil {
						log.Error.Println(err)
						continue
					}
				case types.TracerEvent:
					// Only send event updates for the subscribed tracer.
					if u.TracerID == sub.Tracer {
						if err := sub.Sock.WriteJSON(types.TracerEventsWebSocket{u}); err != nil {
							log.Error.Println(err)
							continue
						}
					}
				case types.Notification:
					if err := sub.Sock.WriteJSON(types.NotificationWebSocket{u}); err != nil {
						log.Error.Println(err)
						continue
					}
				default:
					log.Error.Printf("not sure what it was: %T", u)
					continue
				}
			}
		}
	}
}

func init() {
	updateChan = make(chan interface{}, 10)
	addSubChan = make(chan *subscriber, 10)
	removeSubChan = make(chan int, 10)
	changeSubChan = make(chan []int, 10)
	subscribers = make(map[int]*subscriber, 25)
	go router()
}
