// bulkAddEvents makes a POST request to the bulk events to the API with
// a set of events from the DOM.
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

// requestHandler takes the current set of jobs from the page, filters them
// against the current set of tracer payloads, and sends them as a batch API
// request to the API. Events should contain a list of DOM events.
function requestHandler(domEvents) {
  // A filtered list of DOM events based on if the event has a tracer in it.
  // Each DOM event can have multiple tracer strings.
  let filteredEvents = [];

  // For each DOM write, search for all the tracer strings and collect their location.
  for (let domEventKey in domEvents) {
    const domEvent = domEvents[domEventKey];
    // Each DOM write could have many tracer strings in it. Group these together.
    let tracersPerDomEvent = [];

    // The request is a batched list of DOM events. Iterate through each of them
    // looking for a tracer string.
    for (let id in tracerPayloads) {
      const tracerPayload = tracerPayloads[id];
      // If a tracer was found, add it to the list of tracers found for this event.
      // Continue to the rest of the recorded.
      const tracerLocation = domEvent.msg.indexOf(tracerPayload);
      if (tracerLocation != -1) {
        // Add this location data to the list of tracers per DOM event.
        tracersPerDomEvent.push(tracerPayload);
      }
    }

    // After collecting all the tracers per DOM event, add this DOM event to the
    // list of filtered DOM events that will be submitted in bulk to the event API.
    if (tracersPerDomEvent.length > 0) {
      // Sanity check
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

  if (filteredEvents.length > 0) {
    bulkAddEvents(filteredEvents);
  }
}

// Routes messages from the extension to various functions on the background.
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

// refresheConfig makes an API request for the latest config from `/config`,
// pulls configuration from the extension settings page and gets a current
// list of tracers. refreshConfig is usually called on page load.
async function refreshConfig(wsConnect) {
  const settings = await new Promise(resolve =>
    chrome.storage.local.get({ restHost: "localhost", restPort: 8081 }, res =>
      resolve(res)
    )
  );

  restServer = settings.restHost + ":" + settings.restPort;
  fetch(`http://${restServer}/config`, { headers: { Hoot: "!" } })
    .then(res => res.json())
    .catch(err => console.error(err))
    .then(res => {
      tracerStringTypes = Object.keys(res["tracers"]);
      defaultTracer = res["default-tracer"];

      // TODO: can't figure out why Firefox is throwing an error here
      // about duplicate IDs.
      tracerStringTypes.forEach(i => {
        chrome.contextMenus.remove(i, () => {
          // Context menu for right-clicking on an editable field.
          chrome.contextMenus.create({
            id: i,
            title: i,
            contexts: ["editable"],
            onclick: (info, tab) => {
              chrome.tabs.sendMessage(tab.id, {
                cmd: "clickCache",
                tracerString: i
              });
            }
          });
        });
      });
    });

  fetch(`http://${restServer}/tracers`, { headers: { Hoot: "!" } })
    .then(res => res.json())
    .catch(err => console.error(err))
    .then(
      res =>
        (tracerPayloads = [].concat.apply(
          [],
          res.map(r => [].concat(r.Tracers.map(t => t.TracerPayload)))
        ))
    )
    .catch(err => console.error(err));

  if (wsConnect) {
    websocketConnect();
  }
}

// TODO: consider getting rid of this websocket so that we can do away with persistent
// background page.
// Connect to the websocket endpoint so we don't have to poll for new tracer strings.
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
    // Attempt to reconnect when the socket closes.
    setTimeout(websocketConnect, 1500);
  });
}

// configQuery returns the appropriate configuration information
// that is requested from the content script.
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

// Add a job to the job queue.
function addJobToQueue(message, sender, sendResponse) {
  // If it is the first job added, set a timer to process the jobs.
  if (jobs.length === 0) {
    setTimeout(processDomEvents, 2000);
  }
  jobs.push(message);
}

// Global list of DOM writes. When a job is written to this array
// the background page will wait a few seconds collecting more jobs
// and then send them all off to the API.
let jobs = [];

// Process all the jobs in the current queue.
function processDomEvents() {
  const p = JSON.parse(JSON.stringify(jobs));
  // Clear out the jobs.
  jobs = [];
  // Send any jobs off to the API server.
  requestHandler(p);
}

// Any time the page sends a message to the extension, the above handler should
// take care of it.
chrome.runtime.onMessage.addListener(messageRouter);
// Any time the UI tries to check if the extension is called, it will make an
// external message.
chrome.runtime.onMessageExternal.addListener((r, s, _) => {
  return true;
});

// Configuration defaults
let restServer = "127.0.0.1:443";
let tracerStringTypes = ["Can't connect to API. Is Tracy running?"];
let defaultTracer = "";
let tracerPayloads = [];

refreshConfig(true);
