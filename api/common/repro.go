package common

import (
	"crypto/tls"
	"fmt"
	"io"
	"net"
	"net/url"
	"strings"

	"github.com/nccgroup/tracy/api/store"
	"github.com/nccgroup/tracy/api/types"
	"github.com/nccgroup/tracy/log"
)

// StartReproductions makes the raw HTTP request that initatied the
// tracer, then sends off the event to the extension via websocket
// to be completed by the extension.
func StartReproductions(tracerID, contextID uint) {
	// Get the tracer associated with this event.
	var tracer types.Tracer
	if err := store.DB.First(&tracer, tracerID).Error; err != nil {
		log.Error.Print(err)
		return
	}

	// Get the raw request associated with this tracer.
	var req types.Request
	if err := store.DB.First(&req, tracer.Requests[0].ID).Error; err != nil { //TODO: for now where always just going to grab the first request. This will change once we figure out what to do with this
		log.Error.Print(err)
		return
	}

	// Get the DOMContext associated with the event.
	var context types.DOMContext
	if err := store.DB.First(&context, contextID).Error; err != nil {
		log.Error.Print(err)
		return
	}

	// Get the event associated with the DOM context.
	var event types.TracerEvent
	if err := store.DB.First(&event, context.TracerEventID).Error; err != nil {
		log.Error.Print(err)
		return
	}

	// This is the state machine that picks the appropriate
	// payloads to make sure our reproduction executes properly based
	// on where in the DOM we found the input.
	exploits := exploitStateMachine(context)
	rts := make([]types.ReproductionTest, len(exploits))
	for i, exploit := range exploits {
		rt := types.ReproductionTest{
			TracerEventID: event.ID,
			Exploit:       exploit,
			Successful:    false, // all tests default to false
		}
		go createReproductionTest(req, tracer, context, rt)
		rts[i] = rt
	}

	UpdateSubscribers(types.Reproduction{
		Tracer:            tracer,
		TracerEvent:       event,
		DOMContext:        context,
		ReproductionTests: rts,
	})
}

// createReproductionTest creates a row in the events
// reproduction test table, replays the request that generated
// the event with the exploit, and notifies the extensions
// to see what happened using a tab.
func createReproductionTest(req types.Request, tracer types.Tracer, context types.DOMContext, reproTest types.ReproductionTest) {
	if err := store.DB.Create(&reproTest).Error; err != nil {
		log.Error.Print(err)
		return
	}
	if err := replayInjectionPoint(req, tracer.TracerPayload, reproTest.Exploit); err != nil {
		log.Error.Print(err)
		return
	}
}

// UpdateReproduction changes the status of a tracer event to
// reproduced. This should only happen once the extensions injected
// script is called from one of its reproduction tabs.
func UpdateReproduction(tracerID, contextID, reproID uint, repro types.ReproductionTest) error {
	//TODO: for now, we are just changing the status, but later we might user
	// these other IDs for doing other types of things.
	var r types.ReproductionTest
	if err := store.DB.
		Model(&r).
		Where("id = ?", reproID).
		Update("successful", repro.Successful).
		Error; err != nil {
		log.Warning.Print(err)
		return err
	}
	return nil
}

// exploitStateMachine takes an event and returns a set of payloads
// that will work for the event context when dropped in place for the
// tracer payload used to create the event.
func exploitStateMachine(c types.DOMContext) []string {
	p := payload()
	switch c.HTMLLocationType {
	case types.Attr:
		return []string{
			` onload="` + p + `" onfocus="` + p + `" autofocus="" `,
		}
	case types.NodeName:
		return []string{
			`img src='' onerror="` + p + `"/`,
		}
	case types.Text:
		return []string{
			`<img src='' onerror="` + p + `"/>`,
		}
	case types.AttrVal:
		// TODO: Can't automatically trigger this. Maybe we can do
		// something in the future about firing a click event or
		// something.
		return []string{
			`javascript:` + p,
		}
	case types.Comment:
		return []string{
			`--><img src='' onload="` + p + `" />`,
		}
	}

	return []string{}
}

// payload return the payload the designates XSS was accomplished
func payload() string {
	return "window.postMessage({r:1}, `*`)"
}

// replayInjectionPoint takes a tracer's raw HTTP request
// and replays it with a given exploit instead of the tracer
// string that was used originally.
func replayInjectionPoint(req types.Request, tracerPayload, exploit string) error {
	u, err := url.Parse(req.RequestURL)
	if err != nil {
		log.Warning.Print(err)
		return err
	}

	rr := strings.Replace(req.RawRequest, tracerPayload, url.QueryEscape(exploit), -1)
	// dial require a port. If they used regular 80 and 443, they
	// won't be included in the URL
	hosts := strings.Split(u.Host, ":")
	host := u.Host
	var conn net.Conn
	if u.Scheme != "https" {
		if len(hosts) == 1 {
			host += ":80"
		}
		conn, err := net.Dial("tcp", host)
		if conn != nil {
			defer conn.Close()
		}

		if err != nil {
			log.Warning.Print(err)
			return err
		}

	} else {

		if len(hosts) == 1 {
			host += ":443"
		}
		tserver, err := tls.Dial("tcp", host, &tls.Config{InsecureSkipVerify: true})
		// Have to check for nil differently with tls.Dial because it
		// returns a pointer of a connection instead of a struct.
		var nilTest *tls.Conn
		if tserver != nilTest {
			conn = tserver
			defer conn.Close()
		}

		if err == io.EOF {
			return nil
		}

		if err != nil {
			log.Warning.Print(err)
			return err
		}
	}
	fmt.Fprint(conn, rr)
	return nil
}
