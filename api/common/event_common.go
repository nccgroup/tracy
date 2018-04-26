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
	log.Trace.Printf("Adding the following tracer event: %+v, tracer: %+v", event, tracer)
	var ret []byte
	var err error
	//tracer.TracerEvents = nil //HACK: This is a hack to make this work. The proxy server users this list to send to this function but if this list is filled out here it will do a double inseart. We don't want that and this is the easist way to fix it for now
	// Check if the event is valid JSON.
	var data interface{}
	if err = json.Unmarshal([]byte(event.RawEvent.Data), data); err != nil && event.EventType != "text" {
		// It's not valid JSON. Assume it is HTML.
		event.DOMContexts, err = getDomContexts(event, tracer)
	}

	event.RawEvent.Data = ""

	if err = store.DB.Create(&event).Error; err == nil {
		log.Trace.Printf("Successfully added the tracer event to the database.")
		ret, err = json.Marshal(event)
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

func AddEventData(eventData string) uint {
	var rawEvent types.RawEvent
	err := json.Unmarshal([]byte(eventData), eventData)
	if err != nil {
		eventData = gohtml.Format(eventData)
	} else {
		ind, _ := json.MarshalIndent(eventData, "", "  ")
		eventData = string(ind)
	}

	/* We need to check if the data is already there */
	store.DB.FirstOrCreate(&rawEvent, types.RawEvent{Data: eventData})
	return rawEvent.ID
}

/*GetEvents is the common functionality for getting all the events for a given tracer ID. */
func GetEvents(tracerID uint) ([]byte, error) {
	log.Trace.Printf("Getting all the events.")
	var ret []byte
	var err error

	tracerEvents := make([]types.TracerEvent, 0)
	if err = store.DB.Preload("DOMContexts").Find(&tracerEvents, "tracer_id = ?", tracerID).Error; err == nil {
		cache := make(map[uint]types.RawEvent, 0)
		for i := 0; i < len(tracerEvents); i++ {
			if cachedEvent, ok := cache[tracerEvents[i].RawEventID]; ok {
				tracerEvents[i].RawEvent = cachedEvent
				log.Trace.Printf("Cache hit when querying for unique raw requests.")
			} else {
				rawTracerEvent := types.RawEvent{}
				store.DB.Model(&tracerEvents[i]).Related(&rawTracerEvent)
				tracerEvents[i].RawEvent = rawTracerEvent
				// Add the event to the cache so we don't have to look it up again
				cache[uint(i)] = rawTracerEvent
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

		/* Find all instances of the string string and record their appropriate contexts.*/
		getTracerLocation(doc, &contexts, tracer.TracerPayload, tracerEvent, ret)
		log.Trace.Printf("Got the following DOM contexts from the event: %+v", contexts)

		// Update the tracer with the highest severity
		tracer.TracerEventsLength += 1
		if *ret > tracer.OverallSeverity {
			log.Trace.Println("The severity changed: %+v, %d", tracer, *ret)
			tracer.OverallSeverity = *ret
			// Also, increase the tracer event length by 1
			err = store.DB.Model(&tracer).Updates(map[string]interface{}{
				"overall_severity":     *ret,
				"tracer_events_length": tracer.TracerEventsLength}).Error
		} else {
			err = store.DB.Model(&tracer).Update("tracer_events_length", tracer.TracerEventsLength).Error
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
				if strings.HasPrefix(v, a.Key) && strings.HasPrefix(tracer, a.Val) {
					// If the attribute is one of the above known issues, might be vulnerable.

					sev = 2
					break
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
