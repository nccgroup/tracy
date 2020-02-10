/* global chrome */

// sleep returns a promise that is resolved after the provided number of ms.
export const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// newTracyRequest generates a request object that should be used with
// the tracy API.
export const newTracyRequest = async (path, opts) => {
  if (!opts.headers) {
    opts.headers = {};
  }

  const { apiKey, tracyHost, tracyPort } = await new Promise(r =>
    chrome.storage.local.get(
      {
        apiKey: "",
        tracyHost: "",
        tracyPort: ""
      },
      res => r(res)
    )
  );
  opts.Headers.Hoot = apiKey;
  return new Request(`http://${tracyHost}:${tracyPort}/api/tracy${path}`, opts);
};

// getTracerEvents returns all the tracer events for a given tracer.
export const getTracerEvents = async tracerPayload =>
  await new Promise(r =>
    chrome.runtime.sendMessage(
      {
        "message-type": "database",
        query: "getTracerEventsByPayload",
        tracerPayload: tracerPayload
      },
      res => r(res)
    )
  );

// getTracers returns all the tracers.
export const getTracers = async () =>
  await new Promise(r =>
    chrome.runtime.sendMessage(
      {
        "message-type": "database",
        query: "getTracers"
      },
      res => r(res)
    )
  );

export const retryRequest = async req => {
  while (true) {
    try {
      const resp = await fetch(await req);
      if (!resp.ok) {
        console.error("was not able to make connection to:", req);
        await sleep(1500);
        continue;
      }

      return await resp.json();
    } catch (err) {
      console.error(err);
      await sleep(1500);
    }
  }
};

// enumerate assigns an object an ID property.
export const enumerate = (event, id) => {
  event.ID = id + 1;

  return event;
};

// isEmpty returns true or false if the object is empty.
export const isEmpty = obj => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

// filterResponses filters out events that have the event type of response.
export const filterResponses = context => {
  return context.EventType.toLowerCase() !== "http response";
};

// filterInactive filters out tracers that have no events or contexts.
export const filterInactive = tracer => {
  return tracer.HasTracerEvents;
};

// filterTextNodes filters our events that are text nodes.
export const filterTextNodes = context => {
  return context.EventType.toLowerCase() !== "text";
};

// Enum to human-readable structure to translate the different severity ratings.
const severity = {
  0: "unexploitable",
  1: "suspicious",
  2: "probable",
  3: "exploitable"
};

export const formatRowSeverity = row => {
  return severity[row.OverallSeverity];
};

export const mod = (x, n) => (x % n + n) % n;
export const createKeyDownHandler = (
  tableName,
  lastSelectedTable,
  upHandler,
  downHandler
) => {
  const down = [39, 40];
  const up = [37, 38];
  document.addEventListener("keydown", event => {
    if (
      [...down, ...up].includes(event.keyCode) &&
      lastSelectedTable() === tableName
    ) {
      if (up.includes(event.keyCode)) {
        upHandler();
      } else {
        downHandler();
      }
    }
  });
};

// isLocalStorage tests if a key is in the localStorage.
export const isInLocalStorage = (key, ID) => {
  try {
    return JSON.parse(localStorage.getItem(key)).indexOf(ID) > -1;
  } catch (e) {
    return false;
  }
};

// newTracyNotification checks the browser supports notifications,
// then either asks permission for notifications, or displays the
// formatted notification if the user has already granted permission.
export const newTracyNotification = (tracerPayload, context, onclick) => {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification");
    return;
  }

  if (Notification.permission === "granted") {
    // Let's check whether notification permissions have already been granted
    // If it's okay let's create a notification
    tracyNotification(tracerPayload, context, onclick);
  } else if (Notification.permission !== "denied") {
    // Otherwise, we need to ask the user for permission
    Notification.requestPermission(permission => {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        tracyNotification(tracerPayload, context, onclick);
      }
    });
  }
};

// tracyNotification creates a notification with the tracy logo
// and standard default options, such as requiring interaction.
const tracyNotification = (tracerPayload, context, onclick) => {
  const title = "Tracy found XSS!";
  const body = `Tracer Payload: ${tracerPayload}
Severity: ${context.Severity}
HTML Parent Tag: ${context.HTMLNodeType}`;
  const opts = {
    body: body,
    icon:
      "https://user-images.githubusercontent.com/16947503/38943629-c354d81a-42e6-11e8-9644-cc956d92fbcc.png",
    requireInteraction: true,
    sticky: true
  };

  const n = new Notification(title, opts);
  n.onclick = onclick;
};

export const firstIDByID = (s, m) => {
  if (m.ID < 0) return -1;
  for (let i = 0; i < s.length; i++) {
    if (m.ID === s[i].ID) {
      return i;
    }
  }
  return -1;
};
