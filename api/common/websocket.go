package common

import (
	"github.com/gorilla/websocket"
	"math/rand"
	"time"
	"tracy/api/types"
	"tracy/log"
)

var subscribers map[int]subscriber
var updateChan chan interface{}
var addSubChan chan subscriber
var removeSubChan chan int

type subscriber struct {
	KeyChan chan int
	Sock    *websocket.Conn
	Events  []int
}

/*AddSubscriber takes a websocket connection and adds it to the list of subscribers.
 *New events that happen in package common get pushed these events. */
func AddSubscriber(conn *websocket.Conn) int {
	c := make(chan int, 1)
	addSubChan <- subscriber{c, conn, make([]int, 0)}
	return <-c
}

/*RemoveSubscriber removes the websocket from the list of subscribers. */
func RemoveSubscriber(key int) {
	removeSubChan <- key
}

/*UpdateSubscribers sends an update to all the subscribers. */
func updateSubscribers(update interface{}) {
	updateChan <- update
}

func router() {
	for {
		select {
		case add := <-addSubChan:
			log.Error.Println("Adding a subscriber")
			key := rand.Intn(1000)
			subscribers[key] = add
			add.KeyChan <- key
		case remove := <-removeSubChan:
			log.Error.Println("Removing a subscriber")
			delete(subscribers, remove)
		case update := <-updateChan:
			log.Error.Println("Updating the subscribers")
			for _, sub := range subscribers {
				switch u := update.(type) {
				case types.Tracer, types.Request:
					log.Error.Printf("it was a tracer")
				case types.TracerEvent:
					log.Error.Printf("it was a tracer event")
				default:
					log.Error.Printf("not sure what it was: %T", u)
				}
				if err := sub.Sock.WriteJSON(update); err != nil {
					log.Error.Println(err)
				}
			}
		}
	}
}

func init() {
	rand.Seed(time.Now().UnixNano())
	updateChan = make(chan interface{}, 10)
	addSubChan = make(chan subscriber, 10)
	removeSubChan = make(chan int, 10)
	subscribers = make(map[int]subscriber, 25)
	go router()
}
