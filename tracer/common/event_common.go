package common

import (
	"encoding/json"
	"fmt"
	"golang.org/x/net/html"
	"strings"
	"xxterminator-plugin/log"
	"xxterminator-plugin/tracer/store"
	"xxterminator-plugin/tracer/types"
)

/*AddEvent is the common functionality to add an event to the database. This function
 * has been separated so both HTTP and websocket servers can use it. */
func AddEvent(trcrID int, trcrEvnt types.TracerEvent) ([]byte, error) {
	log.Trace.Printf("Adding the following tracer event: %+v, tracerID: %d", trcrEvnt, trcrID)
	var ret []byte
	var err error

	/* Look up the tracer based on the provided ID. */
	var trcr types.Tracer
	trcr, err = store.DBGetTracerWithEventsByID(store.TracerDB, trcrID)
	if err == nil {
		/* Make sure the ID of the tracer exists. */
		if trcr.ID == 0 {
			err = fmt.Errorf("The tracer ID %d doesn't exist: %+v", trcrID, trcr)
		} else {
			log.Trace.Printf("Found the tracer in the database: %+v.", trcr)

			/* If it is a valid tracer event and the tracer exists, then add it to the database. */
			var event types.TracerEvent
			event, err = store.DBAddTracerEvent(store.TracerDB, trcrEvnt, []string{trcr.TracerString})
			if err == nil {
				if int(event.ID.Int64) != 0 {
					log.Trace.Printf("Successfully added the tracer event to the database: %+v", event)

					/* After adding an event, make sure the context also gets stored at the same time. */
					err = addEventContext(event, trcrID)
					if err == nil {
						log.Trace.Printf("Successfully added the tracer context to the database.")

						/* Need to do an additional query here to return the results of adding the contexts. */
						event, err = store.DBGetTracerEventByID(store.TracerDB, int(event.ID.Int64))


						if err == nil {
							log.Trace.Printf("Got the following event just inserted: %+v", event)
							ret, err = json.Marshal(event)
						}
					}
				} else {
					err = fmt.Errorf("The event added is not the same as the event returned.")
				}
			}
		}
	}

	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return ret, err
}

/*addEventContext is the common functionality for adding data to the event context table. */
func addEventContext(trcrEvnt types.TracerEvent, trcrID int) error {
	log.Trace.Printf("Adding the event context for %+v", trcrEvnt)
	var err error
	var doc *html.Node
	doc, err = html.Parse(strings.NewReader(trcrEvnt.Data.String))
	if err == nil {
		var contexts []types.EventsContext

		/* Need to get the tracer string this event is mapped to. */
		var trcr types.Tracer
		trcr, err = store.DBGetTracerWithEventsByID(store.TracerDB, trcrID)
		if err == nil {
			/* Find all instances of the string string and record their appropriate contexts.*/
			getTracerLocation(doc, &contexts, trcr.TracerString)

			log.Trace.Printf("Got the following contexts from the event: %+v", contexts)

			/* Add the tracer context to the event for each instance of a tracer string found in the DOM. */
			for _, v := range contexts {
				err = store.DBAddEventContext(store.TracerDB, v, trcrEvnt.ID)
				if err != nil {
					log.Warning.Printf(err.Error())
				}
			}
		}
	}

	/* Catch errors that drop. */
	if err != nil {
		log.Warning.Printf(err.Error())
	}

	return err
}

/* Constants used to track the categories for the locations of a tracer string. */
const (
	inAttr = iota
	inText
	inNodeName
	inAttrVal
)

/* Helper function that recursively traverses the DOM notes and records any context
 * surrounding a particular string. */
func getTracerLocation(n *html.Node, tracerLocations *[]types.EventsContext, tracer string) {

	if strings.Contains(n.Data, tracer) {
		if n.Type == html.TextNode {
			log.Trace.Printf("Found Tracer in TextNode. Parent Node: %s, Data: %s\n\r", n.Parent.Data, n.Data)
			*tracerLocations = append(*tracerLocations,
				types.EventsContext{
					NodeName:     types.StringToJSONNullString(n.Parent.Data),
					LocationType: types.Int64ToJSONNullInt64(inText),
					Context:      types.StringToJSONNullString(n.Data),
				})
		} else {
			log.Trace.Printf("Found Tracer in DomNode. Parent Node: %s, Data: %s\n\r", n.Parent.Data, n.Data)
			*tracerLocations = append(*tracerLocations,
				types.EventsContext{
					NodeName:     types.StringToJSONNullString(n.Parent.Data),
					LocationType: types.Int64ToJSONNullInt64(inNodeName),
					Context:      types.StringToJSONNullString(n.Data),
				})
		}
	}

	for _, a := range n.Attr {
		if strings.Contains(a.Key, tracer) {
			fmt.Println(a.Key)
			*tracerLocations = append(*tracerLocations,
				types.EventsContext{
					NodeName:     types.StringToJSONNullString(n.Data),
					LocationType: types.Int64ToJSONNullInt64(inAttr),
					Context:      types.StringToJSONNullString(a.Key),
				})
		}

		if strings.Contains(a.Val, tracer) {
			*tracerLocations = append(*tracerLocations,
				types.EventsContext{
					NodeName:     types.StringToJSONNullString(n.Data),
					LocationType: types.Int64ToJSONNullInt64(inAttrVal),
					Context:      types.StringToJSONNullString(a.Val),
				})
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		getTracerLocation(c, tracerLocations, tracer)
	}
}