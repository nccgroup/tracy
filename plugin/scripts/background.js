/* Helper function for pushing bulk events to the API. */
function bulkAddEvents(events) {
  fetch(`http://${restServer}/tracers/events/bulk`, {
    headers: {
      Hoot: "!",
      "Content-Type": "application/json; charset=UTF-8"
    },
    method: "POST",
    body: JSON.stringify(events)
  }).catch(err =>
    setTimeout(function() {
      bulkAddEvents(events);
    }, 1500)
  );
}

/* Handler function for events triggered from the web page. Events should contain a list of DOM events. This handler
 * searches through each of the DOM events for tracer strings. If it finds a string in the DOM event, it submits
 * an API request to the API server. */
function requestHandler(domEvents) {
  /* A filtered list of DOM events based on if the event has a tracer in it. Each DOM event can have multiple tracer
     * strings. */
  let filteredEvents = [];

  /* For each DOM write, search for all the tracer strings and collect their location. */
  for (let domEventKey in domEvents) {
    const domEvent = domEvents[domEventKey];
    /* Each DOM write could have many tracer strings in it. Group these together. */
    let tracersPerDomEvent = [];

    /* The request is a batched list of DOM events. Iterate through each of them looking for a tracer string. */
    for (let id in tracerPayloads) {
      const tracerPayload = tracerPayloads[id];
      /* If a tracer was found, make sure all the event data is proper and add it to the list of tracers found for this event.
             * Continue to the rest of the recorded. */
      const tracerLocation = domEvent.msg.indexOf(tracerPayload);
      if (tracerLocation != -1) {
        /* Add this location data to the list of tracers per DOM event. */
        tracersPerDomEvent.push(tracerPayload);
      }
    }

    /* After collecting all the tracers per DOM event, add this DOM event to the list of filtered DOM events that
         * will be submitted in bulk to the event API. */
    if (tracersPerDomEvent.length > 0) {
      /* Sanity check the data we are expecting is in the message. */
      if (!domEvent.msg) {
        console.error("The DOM event msg field was not set properly.");
        return;
      } else if (!domEvent.location) {
        console.error("The DOM event location field was not set properly.");
        return;
      } else if (!domEvent.type) {
        console.error("The DOM event type field was not set properly.");
        return;
      }
      const event = {
        TracerEvent: {
          RawEvent: {
            Data: domEvent.msg
          },
          EventURL: encodeURI(domEvent.location),
          EventType: domEvent.type
        },
        TracerPayloads: tracersPerDomEvent
      };
      filteredEvents.push(event);
    }
  }

  /* Send the events to the API. */
  if (filteredEvents.length > 0) {
    bulkAddEvents(filteredEvents);
  }
}

/* Routes messages from the extension to various functions on the background. */
function messageRouter(message, sender, sendResponse) {
  if (message && message["message-type"]) {
    switch (message["message-type"]) {
      case "job":
        addJobToQueue(message, sender, sendResponse);
        break;
      case "config":
        configQuery(message, sender, sendResponse);
        break;
      case "refresh":
        refreshConfig(false);
        break;
    }
  }
}

/* Refreshes the configuration. */
function refreshConfig(wsConnect) {
  chrome.storage.local.get(
    {
      restHost: "localhost",
      restPort: 8081
    },
    function(res) {
      restServer = res.restHost + ":" + res.restPort;
      fetch(`http://${restServer}/config`, { headers: { Hoot: "!" } })
        .then(res => res.json())
        .catch(err => console.error("Error:", error))
        .then(res => {
          tracerStringTypes = Object.keys(res["tracers"]);
          defaultTracer = res["default-tracer"];
        });

      fetch(`http://${restServer}/tracers`, {
        headers: { Hoot: "!" }
      })
        .then(res => res.json())
        .catch(error => console.error("Error:", error))
        .then(res => {
          return [].concat.apply(
            null,
            res.map(r => {
              [].concat(
                r.Tracers.map(t => {
                  return t.TracerPayload;
                })
              );
            })
          );
        });

      if (wsConnect) {
        websocketConnect();
      }
    }
  );
}

/* Connect to the websocket endpoint so we don't have to poll for new tracer strings. */
function websocketConnect() {
  const nws = new WebSocket(`ws://${restServer}/ws`);
  nws.addEventListener("message", function(event) {
    let req = JSON.parse(event.data);
    switch (Object.keys(req)[0]) {
      case "Request":
        req.Request.Tracers.map(t => {
          if (!tracerPayloads.includes(t.TracerPayload)) {
            tracerPayloads.push(t.TracerPayload);
          }
        });
        break;
      default:
        break;
    }
  });

  nws.addEventListener("close", function() {
    setTimeout(websocketConnect, 1500); // Attempt to reconnect when the socket closes.
  });
}

/* Query the configuration. */
function configQuery(message, sender, sendResponse) {
  if (message && message.config) {
    switch (message.config) {
      case "tracer-string-types":
        sendResponse(tracerStringTypes);
        break;
      case "default-tracer":
        sendResponse(defaultTracer);
        break;
      case "enabled":
        sendResponse(enabled);
        break;
    }
  }
}

/* Add a job to the job queue. */
function addJobToQueue(message, sender, sendResponse) {
  // If it is the first job added, set a timer to process the jobs.
  if (jobs.length === 0) {
    setTimeout(processDomEvents, 2000);
  }
  jobs.push(message);
}

/* Global list of DOM writes. Periodically, this will be sent to the background thread and cleared. */
let jobs = [];

/* Process all the jobs in the current queue. */
function processDomEvents() {
  /* If there are no new jobs, continue. */
  if (enabled) {
    const p = JSON.parse(JSON.stringify(jobs));
    /* Clear out the jobs. */
    jobs = [];
    /* Send any jobs off to the API server. */
    requestHandler(p);
  }
}

/* Any time the page sends a message to the extension, the above handler should take care of it. */
chrome.runtime.onMessage.addListener(messageRouter);
chrome.browserAction.onClicked.addListener(function(tab) {
  enabled = !enabled;
  if (!enabled) {
    chrome.browserAction.setIcon({
      path: {
        16: "images/tracy_16x16_x.png"
      }
    });
  } else {
    chrome.browserAction.setIcon({
      path: {
        16: "images/tracy_16x16.png"
      }
    });
  }
});

// Configuration defaults
let restServer = "127.0.0.1:443";
let tracerStringTypes = ["Can't connect to API. Is Tracy running?"];
let defaultTracer = "";
let tracerPayloads = [];
let enabled = true;
refreshConfig(true);
