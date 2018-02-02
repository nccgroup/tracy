package common

import (
	"encoding/json"
	"fmt"
	"golang.org/x/net/html"
	"strings"
	"tracy/log"
	"tracy/tracer/store"
	"tracy/tracer/types"
)

/*AddEvent is the common functionality to add an event to the database. This function
 * has been separated so both HTTP and websocket servers can use it. */
func AddEvent(tracerID int, event types.TracerEvent) ([]byte, error) {
	log.Trace.Printf("Adding the following tracer event: %+v, tracerID: %d", event, tracerID)
	var ret []byte
	var err error

	event.TracerID = tracerID
	if err = store.DB.Create(&event).Error; err == nil {
		log.Trace.Printf("Successfully added the tracer event to the database.")
		var contexts []types.DOMContext
		contexts, err = addDomContext(event)

		if err == nil {
			log.Trace.Printf("Successfully added the DOM context to the database.")
			event.DOMContexts = contexts
			ret, err = json.Marshal(event)
		}
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*addDomContext is the common functionality for adding data to the event context table. */
func addDomContext(tracerEvent types.TracerEvent) ([]types.DOMContext, error) {
	log.Trace.Printf("Adding the event context for %+v", tracerEvent)
	var err error
	var contexts []types.DOMContext

	var doc *html.Node
	doc, err = html.Parse(strings.NewReader(tracerEvent.RawEvent))
	if err == nil {
		/* Need to get the tracer string this event is mapped to. */
		var tracer types.Tracer
		if err = store.DB.First(&tracer, "id = ?", tracerEvent.TracerID).Error; err == nil {
			/* Find all instances of the string string and record their appropriate contexts.*/
			getTracerLocation(doc, &contexts, tracer.TracerString)
			log.Trace.Printf("Got the following DOM contexts from the event: %+v", contexts)
			/* Add the tracer context to the event for each instance of a tracer string found in the DOM. */
			for _, v := range contexts {
				v.TracerEventID = tracerEvent.Model.ID
				//TODO: If multiple errors happen in this loop, we will lose some of the data.
				if err = store.DB.Create(&v).Error; err != nil {
					log.Warning.Printf(err.Error())
				}
			}
		}
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return contexts, err
}

/* Constants used to track the categories for the locations of a tracer string. */
const (
	inAttr = iota
	inText
	inNodeName
	inAttrVal
	inComment
)

/* Helper function that recursively traverses the DOM notes and records any context
 * surrounding a particular string. */
func getTracerLocation(n *html.Node, tracerLocations *[]types.DOMContext, tracer string) {

	if strings.Contains(n.Data, tracer) {
		if n.Type == html.TextNode {
			log.Trace.Printf("Found Tracer in TextNode. Parent Node: %s, Data: %s", n.Parent.Data, n.Data)
			*tracerLocations = append(*tracerLocations,
				types.DOMContext{
					HTMLNodeType:     n.Parent.Data,
					HTMLLocationType: inText,
					EventContext:     n.Data,
				})
		} else if n.Type == html.DocumentNode || n.Type == html.ElementNode || n.Type == html.DoctypeNode {
			log.Trace.Printf("Found Tracer in DomNode. Parent Node: %s, Data: %s", n.Parent.Data, n.Data)
			*tracerLocations = append(*tracerLocations,
				types.DOMContext{
					HTMLNodeType:     n.Parent.Data,
					HTMLLocationType: inNodeName,
					EventContext:     n.Data,
				})
		} else {
			//TODO: although, we should care about these cases, there could be a case where the comment could be broken out of
			log.Trace.Printf("Found a comment node. We probably don't care about these as much. Parent node: %s, Data: %s", n.Parent, n.Data)
			*tracerLocations = append(*tracerLocations,
				types.DOMContext{
					HTMLNodeType:     n.Parent.Data,
					HTMLLocationType: inComment,
					EventContext:     n.Data,
				})
		}
	}

	for _, a := range n.Attr {
		if strings.Contains(a.Key, tracer) {
			*tracerLocations = append(*tracerLocations,
				types.DOMContext{
					HTMLNodeType:     n.Data,
					HTMLLocationType: inAttr,
					EventContext:     a.Key,
				})
		}

		if strings.Contains(a.Val, tracer) {
			*tracerLocations = append(*tracerLocations,
				types.DOMContext{
					HTMLNodeType:     n.Data,
					HTMLLocationType: inAttrVal,
					EventContext:     a.Val,
				})
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		getTracerLocation(c, tracerLocations, tracer)
	}
}
