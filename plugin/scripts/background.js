// prepCache uses a tab to recreate the state of a page with a
// special header attached so that tracy knows on the backend to
// cache the responses in-memory so that we can run reproductions
// without changing the state of the application.
function prepCache(event) {
  // Prep the cache by making a request through the proxy with the
  // SET-CACHE header. Tracy will keep these responses in memory for
  // the rest of our reproduction steps.
  chrome.tabs.create({ active: false }, tab => {
    const beforeHandler = details => {
      return {
        requestHeaders: details.requestHeaders.concat({
          name: "X-TRACY",
          value: "SET-CACHE"
        })
      };
    };

    // Requests that come from this tab ID should be proxied
    // and have the special header `SET-CACHE` added to it.
    chrome.webRequest.onBeforeSendHeaders.addListener(
      beforeHandler,
      { urls: ["<all_urls>"], tabId: tab.id },
      ["blocking", "requestHeaders"]
    );

    // After the page is finished loading, close the tab.
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (tabId === tab.id && changeInfo.status === "complete") {
        removeTab(tab.id);
      }
    });

    // Store the tab so that we can prevent the MutationObserver from triggering
    // during the reproduction steps flows.
    memoTabs.add(tab.id, {
      event: event
    });

    // Clear the browser cache before we prep so that we don't
    // get in a weird situation where we open a tab and some resources
    // were cached by the browser, but when we go to reproduce
    // they aren't in our cache.
    chrome.browsingData.removeCache({});

    // Change the URL of the blank page after all the callbacks are properly
    // set up so that we can capture all the requests.
    chrome.tabs.update(tab.id, { url: event.EventURL });
  });
}

// reproduceFinding takes a tracer and event and attempts to reproduce
// the finding with a valid XSS payload. If done successfully, this
// background page should be able to inject a script to read a predictable
// value from the page. Reproduction are completed using the
// in-memory cache of responses from this event.
function reproduceFinding(tracer, event, context, repros) {
  // For each of the reproduction steps, spin up a tab to
  // test the different exploits.
  repros.map(repro => {
    // After the cache has been prepped, send the exploits.
    chrome.tabs.create({ active: false }, tab => {
      const callback = details => {
        return {
          requestHeaders: details.requestHeaders.concat({
            name: "X-TRACY",
            value:
              "GET-CACHE;" + btoa(repro.Exploit + "--" + tracer.TracerPayload)
          })
        };
      };

      // Requests that come from this tab ID should be proxied
      // and have the special header `GET-CACHE` added to it,
      // along with the data the extension wants to have swapped out
      // on the server.
      chrome.webRequest.onBeforeSendHeaders.addListener(
        callback,
        { urls: ["<all_urls>"], tabId: tab.id },
        ["blocking", "requestHeaders"]
      );

      // After the page is finished loading, close the tab.
      chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === "complete") {
          // We can probably remove this timeout once we learn more about
          // the average time it takes to fire a payload after the page has
          // completed.
          removeTab(tab.id);
        }
      });

      memoTabs.add(tab.id, {
        tracer: tracer,
        event: event,
        context: context,
        repro: repro,
        callback: callback
      });

      chrome.tabs.update(tab.id, { url: event.EventURL });
    });
  });
}

// tabs keeps a running tally of the currently tested tabs
// that are being opened and closed for reproduction steps.
function tabs() {
  let tabs = {};
  return {
    get: () => tabs,
    add: (t, args) => (tabs[`${t}`] = args),
    del: t => delete tabs[`${t}`]
  };
}
const memoTabs = tabs();

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
          EventURL: domEvent.location,
          EventType: domEvent.type,
          Extras: JSON.stringify(domEvent.extras)
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
  if (message["message-type"]) {
    switch (message["message-type"]) {
      case "job":
        addJobToQueue(message, sender);
        break;
      case "config":
        configQuery(message, sender, sendResponse);
        break;
      case "screenshot":
        handleScreenshot(message, sender, sendResponse);
        return true;
    }
  } else if (message.r) {
    // Changed the format of the message so we
    // wouldn't have such a long XSS payload.
    updateReproduction(message, sender);
  }
}

// handleScreenshot takes a screenshot of the requesting tab,
// then sends it back to the request tab so that it can be
// used in the input capture.
async function handleScreenshot(message, sender, callback) {
  callback(await captureScreenshot(sender.tab.id));
}

// captureScreenshot creates an image of that tab with the specified dimensions
// and offset.
async function captureScreenshot(tabID) {
  const tab = await new Promise(r => chrome.tabs.get(tabID, tab => r(tab)));
  return await new Promise(r =>
    chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, d => r(d))
  );
}

// updateReproduction validates that a particular tab
// executed a Javascript payload correctly.
function updateReproduction(message, sender) {
  const tab = memoTabs.get()[sender.tab.id];
  if (!tab) {
    return;
  }
  const reproTest = { Successful: true };

  fetch(
    `http://${restServer}/tracers/${tab.tracer.ID}/events/${
      tab.context.ID
    }/reproductions/${tab.repro.ID}`,
    {
      method: "PUT",
      body: JSON.stringify(reproTest),
      headers: { Hoot: "!" }
    }
  ).catch(err => console.error(err));

  removeTab(sender.tab.id);
}

// removeTab removes the tab from the browser and also removes the
// tab from list of currently available tabs that are cached.
function removeTab(id) {
  // Close the tab when we are done with it.
  chrome.tabs.remove(id);
  // Remove the tab from the list of collected tabs.
  memoTabs.del(id);
}

// refresheConfig makes an API request for the latest config from `/config`,
// pulls configuration from the extension settings page and gets a current
// list of tracers. refreshConfig is usually called on page load.
async function refreshConfig(wsConnect) {
  const ok = await new Promise(resolve =>
    chrome.tabs.query({ active: true }, tab => {
      // Don't refresh config if we are in the reproduction steps flow.
      if (memoTabs.get()[tab.id]) {
        resolve(false);
      } else {
        resolve(true);
      }
    })
  );
  if (!ok) {
    return;
  }
  const settings = await new Promise(resolve =>
    chrome.storage.local.get({ restHost: "127.0.0.1", restPort: 7777 }, res =>
      resolve(res)
    )
  );

  restServer = settings.restHost + ":" + settings.restPort;
  fetch(`http://${restServer}/config`, { headers: { Hoot: "!" } })
    .then(res => res.json())
    .catch(err => console.error(err))
    .then(res => {
      tracerStringTypes = Object.keys(res["TracerStrings"]);

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

  nws.addEventListener("message", event => {
    let req = JSON.parse(event.data);
    switch (Object.keys(req)[0]) {
      case "Request":
        req.Request.Tracers.map(t => {
          if (!tracerPayloads.includes(t.TracerPayload)) {
            tracerPayloads.push(t.TracerPayload);
          }
        });
        break;
      case "Reproduction":
        reproduceFinding(
          req.Reproduction.Tracer,
          req.Reproduction.TracerEvent,
          req.Reproduction.DOMContext,
          req.Reproduction.ReproductionTests
        );
        break;
      case "Notification":
        const n = req.Notification;
        n.Event.DOMContexts.map(c => {
          if (c.Severity >= 2) {
            prepCache(n.Event);
            return true;
          }
          return false;
        });
        break;
      default:
        break;
    }
  });

  // Attempt to reconnect when the socket closes.
  nws.addEventListener("close", () => setTimeout(websocketConnect, 1500));
}

// configQuery returns the appropriate configuration information
// that is requested from the content script.
function configQuery(message, sender, sendResponse) {
  if (message && message.config) {
    switch (message.config) {
      case "tracer-string-types":
        sendResponse(tracerStringTypes);
        break;
      case "enabled":
        sendResponse(enabled);
        break;
    }
  }
}

// Add a job to the job queue.
async function addJobToQueue(message, sender) {
  // Don't add a job if it's one of the tabs that we have collected
  // in our reproduction steps flow.
  if (memoTabs.get()[sender.tab.id]) {
    return;
  }
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

// Update the configuration on every page load.
chrome.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    refreshConfig(false);
  }
});

// Always want the autofill menu there.
chrome.contextMenus.create({
  id: "auto-fill",
  title: "Auto-fill page",
  contexts: ["all"],
  onclick: (info, tab) => {
    chrome.tabs.sendMessage(tab.id, {
      cmd: "auto-fill"
    });
  }
});

chrome.contextMenus.create({
  id: "sep",
  type: "separator",
  contexts: ["all"]
});

// Configuration defaults
let restServer = "127.0.0.1:443";
let tracerStringTypes = ["Can't connect to API. Is Tracy running?"];
let tracerPayloads = [];
refreshConfig(true);
