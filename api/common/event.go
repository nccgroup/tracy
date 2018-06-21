package common

import (
	"encoding/json"
	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/log"
	"strings"

	"github.com/yosssi/gohtml"
	"golang.org/x/net/html"
)

// AddEvent is the common functionality to add an event to the database.
func AddEvent(tracer types.Tracer, event types.TracerEvent) ([]byte, error) {
	var (
		ret []byte
		err error
	)

	// Only check for DOM contexts when we have format type HTML.
	if event.RawEvent.Format == types.HTML {
		if event.DOMContexts, err = getDOMContexts(event, tracer); err != nil {
			log.Warning.Print(err)
			return ret, err
		}
	}

	// We've already added the raw event to get a valid raw event ID, so remove
	// it here so the following create doesn't try to add it again. We do this
	// so that multiple events that come from the same raw event can share the
	// raw event table and we don't end up storing lots of duplicate large columns.
	copy := event
	event.RawEvent = types.RawEvent{}
	if err = store.DB.Create(&event).Error; err != nil {
		log.Warning.Print(err)
		return ret, err
	}

	copy.ID = event.ID
	UpdateSubscribers(copy)
	if ret, err = json.Marshal(copy); err != nil {
		log.Warning.Print(err)
		return ret, err
	}

	return ret, nil
}

// AddEventData adds a raw event if it's the first of that type of event,
// Otherwise, it returns the first event that looks like it. It also tags
// the raw data as either HTML or JSON.
func AddEventData(eventData string) types.RawEvent {
	var (
		re   types.RawEvent
		err  error
		e    string
		f    uint
		data interface{}
	)

	// Test if data is HTML or JSON by attempting to unmarshal the string as a
	// JSON string. If it fails, it is most likely HTML.
	// TODO: might be good in the future to infer from the content type
	// TODO: header.
	if err = json.Unmarshal([]byte(eventData), &data); err != nil {
		e = gohtml.Format(eventData)
		f = types.HTML
	} else {
		var ind []byte
		ind, err = json.MarshalIndent(eventData, "", "  ")
		if err != nil {
			log.Error.Print(err)
			return re
		}
		e = string(ind)
		f = types.JSON
	}

	// We need to check if the data is already there.
	if err = store.DB.FirstOrCreate(&re, types.RawEvent{Data: e, Format: f}).Error; err != nil {
		log.Error.Printf("Wasn't able to create a raw event: %+v", re)
	}

	return re
}

// GetEvents is the common functionality for getting all the events for a given
// tracer ID from the database.
func GetEvents(tracerID uint) ([]byte, error) {
	var (
		ret []byte
		err error
	)

	tracerEvents := make([]types.TracerEvent, 0)
	if err = store.DB.Preload("DOMContexts").Find(&tracerEvents, "tracer_id = ?", tracerID).Error; err != nil {
		log.Warning.Print(err)
		return ret, err
	}

	cache := make(map[uint]types.RawEvent, 0)
	var i uint
	l := uint(len(tracerEvents))
	for i = 0; i < l; i++ {
		if cachedEvent, ok := cache[tracerEvents[i].RawEventID]; ok {
			tracerEvents[i].RawEvent = cachedEvent
		} else {
			rawTracerEvent := types.RawEvent{}
			store.DB.Model(&tracerEvents[i]).Related(&rawTracerEvent)
			tracerEvents[i].RawEvent = rawTracerEvent
			// Add the event to the cache so we don't have to look it up again.
			cache[i] = rawTracerEvent
		}
	}

	if ret, err = json.Marshal(tracerEvents); err != nil {
		log.Warning.Print(err)
	}

	return ret, err
}

// getDomContexts searches through the raw tracer event and finds all of tracer
// occurrences specified by the tracer passed in.
func getDOMContexts(event types.TracerEvent, tracer types.Tracer) ([]types.DOMContext, error) {
	var (
		contexts []types.DOMContext
		sev      uint
		ret      *uint = &sev
	)

	// Parse the event as an HTML document so we can inspect the DOM for where
	// user-input was output.
	doc, err := html.Parse(strings.NewReader(event.RawEvent.Data))
	if err != nil {
		log.Warning.Print(err)
		return contexts, err
	}

	// There are two places that will be calling this function. In one place, the API
	// string doesn't send the tracer string with its request, so we need to fetch it.
	// Otherwise, the tracer struct should have it already and we don't need to make
	// another db call.
	if tracer.TracerPayload == "" {
		if err = store.DB.First(&tracer, "id = ?", event.TracerID).Error; err != nil {
			log.Warning.Print(err)
			return contexts, err
		}
	}
	old := tracer.HasTracerEvents

	// Find all instances of the string string and record their appropriate contexts.
	getTracerLocation(doc, &contexts, tracer.TracerPayload, event, ret)

	if len(contexts) == 0 {
		return contexts, nil
	}

	// All text events from the plugin will be unexploitable.
	if event.EventType != "text" {
		*ret = 0
	}

	tracer.HasTracerEvents = true
	c := tracer
	c.TracerEvents = make([]types.TracerEvent, 0)
	newSev := false

	// Update the tracer with the highest severity.
	if *ret > tracer.OverallSeverity {
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
		err = store.DB.Model(&c).Updates(map[string]interface{}{
			"has_tracer_events": tracer.HasTracerEvents,
		}).Error
	}

	// If we updated the severity or got our first event, update the clients
	// connected to the websocket.
	if !old || newSev {
		UpdateSubscribers(tracer)
	}

	return contexts, err
}

// Helper function that recursively traverses the DOM notes and records any context
// surrounding a particular string.
// TODO: consider moving the severity rating stuff out of this function so we can
// clean it up a bit.
func getTracerLocation(n *html.Node, tracerLocations *[]types.DOMContext, tracer string, tracerEvent types.TracerEvent, highest *uint) {
	var sev uint
	if strings.Contains(n.Data, tracer) {
		if n.Type == html.TextNode {
			*tracerLocations = append(*tracerLocations,
				types.DOMContext{
					TracerEventID:    tracerEvent.ID,
					HTMLNodeType:     n.Parent.Data,
					HTMLLocationType: types.Text,
					EventContext:     gohtml.Format(n.Data),
					Severity:         sev,
				})
		} else if n.Type == html.DocumentNode || n.Type == html.ElementNode || n.Type == html.DoctypeNode {

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
			// Getting cases for JavaScript protocol and on handlers.
			attrs := []string{"href", "on"}

			if tracerEvent.EventType != "response" {
				sev = 1
			}

			for _, v := range attrs {
				// If the href starts with a tracer string, need to look for JavaScript:
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
