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

	// We update the subscribers with the copy instead of the event because
	// we don't want to erase the already recorded events that client might
	// be showing.
	copy.ID = event.ID
	UpdateSubscribers(copy)
	if ret, err = json.Marshal(copy); err != nil {
		log.Warning.Print(err)
	}

	return ret, err
}

// getDomContexts searches through the raw tracer event that should be HTML and
// finds all of tracer occurrences specified by the tracer passed in.
func getDOMContexts(event types.TracerEvent, tracer types.Tracer) ([]types.DOMContext, error) {
	var (
		contexts []types.DOMContext
		sev      uint
		sevp     = &sev
		err      error
		doc      *html.Node
	)

	// Parse the event as an HTML document so we can inspect the DOM for where
	// user-input was output.
	if doc, err = html.Parse(strings.NewReader(event.RawEvent.Data)); err != nil {
		log.Warning.Print(err)
		return contexts, err
	}

	old := tracer.HasTracerEvents

	// Find all instances of the string string and record their appropriate contexts.
	getTracerLocation(doc, &contexts, tracer.TracerPayload, event, sevp)

	if len(contexts) == 0 {
		return contexts, nil
	}

	// All text events from the plugin will most likely be unexploitable.
	if event.EventType == "text" {
		*sevp = 0
	}

	tracer.HasTracerEvents = true
	c := tracer
	c.TracerEvents = make([]types.TracerEvent, 0)
	newSev := false

	// Update the tracer with the highest severity.
	if *sevp > tracer.OverallSeverity {
		tracer.OverallSeverity = *sevp
		c.OverallSeverity = *sevp

		// Also, increase the tracer event length by 1
		err = store.DB.Model(&c).Updates(map[string]interface{}{
			"overall_severity": *sevp,
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

// Helper function that recursively traverses the DOM nodes and records any context
// surrounding a particular string.
// TODO: consider moving the severity rating stuff out of this function so we can
// clean it up a bit.
func getTracerLocation(n *html.Node, tracerLocations *[]types.DOMContext, tracer string, tracerEvent types.TracerEvent, highest *uint) {
	var sev uint

	// Just in case the HTML doesn't have a parent, we don't want to dereference a
	// a nil pointer
	if n.Parent == nil {
		n.Parent = &html.Node{
			Data: "",
		}
	}
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
			// TODO: although, we should care about these cases, there could be a
			// case where the comment could be broken out of
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

		if sev > *highest {
			*highest = sev
		}
	}

	for _, a := range n.Attr {
		if strings.Contains(a.Key, tracer) {
			if tracerEvent.EventType != "response" {
				sev = 3
			} else {
				sev = 1
			}

			*tracerLocations = append(*tracerLocations,
				types.DOMContext{
					TracerEventID:    tracerEvent.ID,
					HTMLNodeType:     n.Data,
					HTMLLocationType: types.Attr,
					EventContext:     a.Val,
					Severity:         sev,
				})
		} else if strings.Contains(a.Val, tracer) {
			// By default, user-input inside an attribute value is interesting.
			sev = 1

			// HTTP responses don't mean as much.
			if tracerEvent.EventType != "response" {
				// If the href starts with a tracer string, need to look for JavaScript:
				if a.Key == "href" && strings.HasPrefix(a.Val, tracer) {
					sev = 2
				} else if strings.HasPrefix(a.Key, "on") {
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

		if sev > *highest {
			*highest = sev
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		getTracerLocation(c, tracerLocations, tracer, tracerEvent, highest)
	}
}

// AddEventData adds a raw event if it's the first of that type of event,
// Otherwise, it returns the first event that looks like it. It also tags
// the raw data as either HTML or JSON.
func AddEventData(eventData string) (types.RawEvent, error) {
	var (
		re  types.RawEvent
		err error
		e   string
		f   uint
	)

	// Test if data is HTML or JSON by attempting to unmarshal the string as a
	// JSON string. If it fails, it is most likely HTML.
	// TODO: might be good in the future to infer from the content type
	// TODO: header.
	if ok := json.Valid([]byte(eventData)); !ok {
		e = gohtml.Format(eventData)
		f = types.HTML
	} else {
		var ind []byte
		ind, err = json.MarshalIndent(eventData, "", "  ")
		if err != nil {
			log.Warning.Print(err)
			return re, err
		}
		e = string(ind)
		f = types.JSON
	}

	// We need to check if the data is already there.
	if err = store.DB.FirstOrCreate(&re, types.RawEvent{Data: e, Format: f}).Error; err != nil {
		log.Warning.Printf("Wasn't able to create a raw event: %+v", re)
		return re, err
	}

	return re, nil
}

// GetEvents is the common functionality for getting all the events for a given
// tracer ID from the database.
func GetEvents(tracerID uint) ([]byte, error) {
	var (
		ret          []byte
		err          error
		tracerEvents []types.TracerEvent
	)

	if err = store.DB.Preload("DOMContexts").Find(&tracerEvents, "tracer_id = ?", tracerID).Error; err != nil {
		log.Warning.Print(err)
		return ret, err
	}

	cache := make(map[int]types.RawEvent, 0)
	for k, v := range tracerEvents {
		if cachedEvent, ok := cache[int(v.RawEventID)]; ok {
			v.RawEvent = cachedEvent
		} else {
			rawTracerEvent := types.RawEvent{}
			store.DB.Model(&v).Related(&rawTracerEvent)
			tracerEvents[k].RawEvent = rawTracerEvent
			// Add the event to the cache so we don't have to look it up again.
			cache[k] = rawTracerEvent
		}
	}

	if ret, err = json.Marshal(tracerEvents); err != nil {
		log.Warning.Print(err)
	}

	return ret, err
}
