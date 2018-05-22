package common

import (
	"encoding/json"
	"strings"
	"tracy/api/store"
	"tracy/api/types"
	"tracy/log"

	"github.com/yosssi/gohtml"
	"golang.org/x/net/html"
)

/*AddEvent is the common functionality to add an event to the database. This function
 * has been separated so both HTTP and websocket servers can use it. */
func AddEvent(tracer types.Tracer, event types.TracerEvent) ([]byte, error) {
	log.Trace.Printf("Adding the following tracer event: %d, tracer: %d", event.ID, tracer.ID)
	var ret []byte
	var err error

	// Check if the event is valid JSON.
	var data interface{}
	if err = json.Unmarshal([]byte(event.RawEvent.Data), data); err != nil && event.EventType != "text" {
		// It's not valid JSON. Assume it is HTML.
		event.DOMContexts, err = getDomContexts(event, tracer)
	}

	// We've already added the raw event to get a valid raw event ID, so remove it here so the following create doesn't try to add it again.
	copy := event
	event.RawEvent = types.RawEvent{}
	if err = store.DB.Create(&event).Error; err == nil {
		copy.ID = event.ID
		UpdateSubscribers(copy)
		ret, err = json.Marshal(copy)
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*AddEventData adds our raw event first to the database and returns the object. */
func AddEventData(eventData string) types.RawEvent {
	var rawEvent types.RawEvent
	err := json.Unmarshal([]byte(eventData), eventData)
	if err != nil {
		eventData = gohtml.Format(eventData)
	} else {
		ind, _ := json.MarshalIndent(eventData, "", "  ")
		eventData = string(ind)
	}

	/* We need to check if the data is already there */
	if err = store.DB.FirstOrCreate(&rawEvent, types.RawEvent{Data: eventData}).Error; err != nil {
		log.Error.Printf("Wasn't able to create a raw event: %+v", rawEvent)
	}

	return rawEvent
}

/*GetEvents is the common functionality for getting all the events for a given tracer ID. */
func GetEvents(tracerID uint) ([]byte, error) {
	log.Trace.Printf("Getting all the events.")
	var ret []byte
	var err error

	tracerEvents := make([]types.TracerEvent, 0)
	if err = store.DB.Preload("DOMContexts").Find(&tracerEvents, "tracer_id = ?", tracerID).Error; err == nil {
		cache := make(map[uint]types.RawEvent, 0)
		var i uint
		l := uint(len(tracerEvents))
		for i = 0; i < l; i++ {
			if cachedEvent, ok := cache[tracerEvents[i].RawEventID]; ok {
				tracerEvents[i].RawEvent = cachedEvent
				log.Trace.Printf("Cache hit when querying for unique raw requests.")
			} else {
				rawTracerEvent := types.RawEvent{}
				store.DB.Model(&tracerEvents[i]).Related(&rawTracerEvent)
				tracerEvents[i].RawEvent = rawTracerEvent
				// Add the event to the cache so we don't have to look it up again
				cache[i] = rawTracerEvent
			}
		}
		log.Trace.Printf("Successfully got the tracer event: %+v\n\n", tracerEvents)
		ret, err = json.Marshal(tracerEvents)
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*addDomContext is the common functionality for adding data to the event context table. */
func getDomContexts(tracerEvent types.TracerEvent, tracer types.Tracer) ([]types.DOMContext, error) {
	log.Trace.Printf("Adding the event context for %+v", tracerEvent)
	var err error
	var contexts []types.DOMContext

	var doc *html.Node
	var sev uint = 0
	var ret *uint = &sev
	doc, err = html.Parse(strings.NewReader(tracerEvent.RawEvent.Data))
	if err == nil {
		// There are two places that will be calling this function. In one place, the API
		// string doesn't send the tracer string with its request, so we need to fetch it.
		// Otherwise, the tracer struct should have it already and we don't need to make
		// another db call.
		if tracer.TracerPayload == "" {
			if err = store.DB.First(&tracer, "id = ?", tracerEvent.TracerID).Error; err != nil {
				goto Error
			}
		}
		old := tracer.HasTracerEvents

		/* Find all instances of the string string and record their appropriate contexts.*/
		getTracerLocation(doc, &contexts, tracer.TracerPayload, tracerEvent, ret)
		log.Trace.Printf("Got the following DOM contexts from the event: %+v", contexts)

		if len(contexts) > 0 {
			tracer.HasTracerEvents = true
			c := tracer
			c.TracerEvents = make([]types.TracerEvent, 0)
			newSev := false
			// Update the tracer with the highest severity
			if *ret > tracer.OverallSeverity {
				log.Trace.Printf("The severity changed: %+v, %d", tracer, *ret)
				tracer.OverallSeverity = *ret
				c.OverallSeverity = *ret

				// Also, increase the tracer event length by 1
				err = store.DB.Model(&c).Updates(map[string]interface{}{
					"overall_severity": *ret,
				}).Error
				newSev = true
			}

			// If we used to have no events, change that now.
			if !old {
				log.Trace.Printf("The events length changed changed: %+v, %d", tracer, *ret)
				err = store.DB.Model(&c).Updates(map[string]interface{}{
					"has_tracer_events": tracer.HasTracerEvents,
				}).Error
			}

			if !old || newSev {
				UpdateSubscribers(tracer)
			}

		}
	}

Error:
	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return contexts, err
}

/* Helper function that recursively traverses the DOM notes and records any context
 * surrounding a particular string. */
func getTracerLocation(n *html.Node, tracerLocations *[]types.DOMContext, tracer string, tracerEvent types.TracerEvent, highest *uint) {
	var sev uint = 0
	if strings.Contains(n.Data, tracer) {
		if n.Type == html.TextNode {
			log.Trace.Printf("Found Tracer in TextNode. Parent Node: %s, Data: %s", n.Parent.Data, n.Data)
			*tracerLocations = append(*tracerLocations,
				types.DOMContext{
					TracerEventID:    tracerEvent.ID,
					HTMLNodeType:     n.Parent.Data,
					HTMLLocationType: types.Text,
					EventContext:     gohtml.Format(n.Data),
					Severity:         sev,
				})
		} else if n.Type == html.DocumentNode || n.Type == html.ElementNode || n.Type == html.DoctypeNode {
			log.Trace.Printf("Found Tracer in DomNode. Parent Node: %s, Data: %s", n.Parent.Data, n.Data)

			if n.Parent.Data == "script" {
				if tracerEvent.EventType != "response" {
					sev = 1
				}
			}

			// Element nodes .Data text is the tag name. If we have a tracer in the tag
			// name and its not in the HTTP response, its vulnerable to XSS.
			if n.Type == html.ElementNode {
				if tracerEvent.EventType != "response" {
					sev = 3
				}
			}

			*tracerLocations = append(*tracerLocations,
				types.DOMContext{
					TracerEventID:    tracerEvent.ID,
					HTMLNodeType:     n.Parent.Data,
					HTMLLocationType: types.NodeName,
					EventContext:     gohtml.Format(n.Data),
					Severity:         sev,
				})
		} else {
			//TODO: although, we should care about these cases, there could be a case where the comment could be broken out of
			log.Trace.Printf("Found a comment node. We probably don't care about these as much. Parent node: %s, Data: %s", n.Parent, n.Data)
			if tracerEvent.EventType != "response" {
				sev = 1
			}
			*tracerLocations = append(*tracerLocations,
				types.DOMContext{
					TracerEventID:    tracerEvent.ID,
					HTMLNodeType:     n.Parent.Data,
					HTMLLocationType: types.Comment,
					EventContext:     gohtml.Format(n.Data),
					Severity:         sev,
				})
		}
	}

	for _, a := range n.Attr {
		if strings.Contains(a.Key, tracer) {
			if tracerEvent.EventType != "response" {
				sev = 3
			}
			*tracerLocations = append(*tracerLocations,
				types.DOMContext{
					TracerEventID:    tracerEvent.ID,
					HTMLNodeType:     n.Data,
					HTMLLocationType: types.Attr,
					EventContext:     a.Key,
					Severity:         sev,
				})
		}

		if strings.Contains(a.Val, tracer) {
			// Getting cases for JavaScript protocol and on handlers
			attrs := []string{"href", "on"}

			if tracerEvent.EventType != "response" {
				sev = 1
			}

			for _, v := range attrs {
				// If the href starts with a tracer string, need to look for javascript:
				if v == "href" {
					if strings.HasPrefix(tracer, a.Val) {
						sev = 2
					} else {
						// href with user-supplied values is still interesting
						sev = 1
					}
				} else if strings.HasPrefix(v, a.Key) {
					// for on handlers, these are very interesting
					sev = 2
				}
			}

			*tracerLocations = append(*tracerLocations,
				types.DOMContext{
					TracerEventID:    tracerEvent.ID,
					HTMLNodeType:     n.Data,
					HTMLLocationType: types.AttrVal,
					EventContext:     a.Val,
					Severity:         sev,
				})
		}
	}

	if sev > *highest {
		*highest = sev
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		getTracerLocation(c, tracerLocations, tracer, tracerEvent, highest)
	}
}
