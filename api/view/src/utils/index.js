import { store } from "../index";

// sleep returns a promise that is resolved after the provided number of ms.
const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// newTracyRequest generates a request object that should be used with
// the tracy API.
const newTracyRequest = async (path, opts) => {
  while (true) {
    const state = store.getState();
    if (!opts.headers) {
      opts.headers = {};
    }
    opts.headers.Hoot = "!";
    return new Request(
      `http://${state.tracyHost}:${state.tracyPort}/api/tracy${path}`,
      opts
    );
  }
};

// reproduce sends the API request to trigger a reproduction.
const reproduce = async (tracerID, contextID) => {
  return await retryRequest(
    newTracyRequest(`/tracers/${tracerID}/events/${contextID}/reproductions`, {
      method: "POST"
    })
  );
};

// getTracerEvents gets the bulk events via an HTTP GET request.
const getTracerEvents = async tracerID => {
  return await retryRequest(
    newTracyRequest(`/tracers/${tracerID}/events`, {
      method: "GET"
    })
  );
};

// getTracers gets the bulk tracers via an HTTP GET request.
const getTracers = async () => {
  return await retryRequest(
    newTracyRequest(`/tracers`, {
      method: "GET"
    })
  );
};

// getProjects gets the projects available to view.
const getProjects = async () => {
  return await retryRequest(
    newTracyRequest(`/projects`, {
      method: "GET"
    })
  );
};

// delProject issues an API request to delete a project from disk.
const delProject = async proj => {
  return await retryRequest(
    newTracyRequest(`/projects?proj=${proj}`, {
      method: "DELETE"
    })
  );
};

// switchProject makes the API request to switch projects.
const switchProject = async proj => {
  return await retryRequest(
    this.newTracyRequest(`/projects?proj=${proj}`, {
      method: "PUT"
    })
  );
};

const retryRequest = async req => {
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
const enumerate = (event, id) => {
  event.ID = id + 1;

  return event;
};

// parseURLParameters returns the URL query parameters of a url as a
// comma-separated list.
const parseURLParameters = url => {
  const splitOnParam = url.split("?");
  if (splitOnParam.length <= 0) {
    return "";
  }
  return splitOnParam[1].replace("&", ", ");
};

// parseHost returns the hostname from a URL.
const parseHost = url => {
  // In case the url has a protocol, remove it.
  const protocolSplit = url.split("://");
  let withoutProtocol;
  if (protocolSplit.length > 1) {
    withoutProtocol = protocolSplit[1];
  } else {
    withoutProtocol = protocolSplit[0];
  }

  const host = withoutProtocol.split("?")[0];
  const pathIndex = host.indexOf("/");

  if (pathIndex !== -1) {
    return host.substring(0, pathIndex);
  }
  return host;
};

// parsePath returns the path for a URL.
const parsePath = url => {
  // In case the url has a protocol, remove it.
  const protocolSplit = url.split("://");
  let withoutProtocol;
  if (protocolSplit.length > 1) {
    withoutProtocol = protocolSplit[1];
  } else {
    withoutProtocol = protocolSplit[0];
  }

  const host = withoutProtocol.split("?")[0];
  const pathIndex = host.indexOf("/");
  if (pathIndex !== -1) {
    return host.substring(pathIndex, host.length);
  } else {
    return "/";
  }
};

// isEmpty returns true or false if the object is empty.
const isEmpty = obj => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

// filterResponses filters out events that have the event type of response.
const filterResponses = context => {
  return context.EventType.toLowerCase() !== "http response";
};

// filterInactive filters out tracers that have no events or contexts.
const filterInactive = tracer => {
  return tracer.HasTracerEvents;
};

// filterTextNodes filters our events that are text nodes.
const filterTextNodes = context => {
  return context.EventType.toLowerCase() !== "text";
};

// parseVisibleEvents converts raw events from the API into events that can be
// read by the table.
const parseVisibleEvents = (events = [], sfilters = []) => {
  if (events.length <= 0) {
    return [];
  }

  const parsedEvents = [].concat
    .apply([], events.map(formatEvent))
    .map(enumerate)
    .filter(n => n);

  return sfilters.reduce((accum, cur) => {
    return accum.filter(sfilters[cur]);
  }, parsedEvents);
};

// locationTypes is a to human-readable structure to translate the various DOM
// contexts.
const locationTypes = {
  0: "attribute name",
  1: "leaf node",
  2: "node name",
  3: "attribute value",
  4: "comment block"
};

// Enum to human-readable structure to translate the different severity ratings.
const severity = {
  0: "unexploitable",
  1: "suspicious",
  2: "probable",
  3: "exploitable"
};

// formatRequest mesages the request objects into a set of tracer data structure so the
// table can read their columns.
const formatRequest = req => {
  return req.Tracers.map(t => formatTracer(t, req));
};

// formatTracer returns a new tracer object with some its fields
// changed to be read better by the tables.
const formatTracer = (tracer, request) => {
  if (request) {
    return {
      ID: tracer.ID,
      RawRequest: request.RawRequest,
      RequestMethod: request.RequestMethod,
      RequestURL: request.RequestURL,
      TracerString: tracer.TracerString,
      TracerPayload: tracer.TracerPayload,
      TracerLocationIndex: tracer.TracerLocationIndex,
      TracerLocationType: tracer.TracerLocationType,
      OverallSeverity: tracer.OverallSeverity,
      HasTracerEvents: tracer.HasTracerEvents,
      Screenshot: tracer.Screenshot
    };
  }

  return {
    ID: tracer.ID,
    RawRequest: "n/a",
    RequestMethod: "n/a",
    RequestURL: "n/a",
    TracerString: tracer.TracerString,
    TracerPayload: tracer.TracerPayload,
    TracerLocationIndex: tracer.TracerLocationIndex,
    TracerLocationType: tracer.TracerLocationType,
    OverallSeverity: tracer.OverallSeverity,
    HasTracerEvents: tracer.HasTracerEvents,
    Screenshot: tracer.Screenshot
  };
};

const formatRowSeverity = (row, rowIdx) => {
  return severity[row.OverallSeverity];
};

// formatEvent formats an event context into its corresponding columns.
const formatEvent = (event, eidx) => {
  if (!event.DOMContexts || event.DOMContexts.length <= 0) {
    // If there are no DOMContexts, it is most likely an HTTP response.
    return {
      HTMLLocationType: "n/a",
      HTMLNodeType: "n/a",
      EventContext: "n/a",
      RawEvent: event.RawEvent.Data,
      RawEventIndex: 0, // this isn't really correct. there could be a case where there are two of the same tracer in an HTTP response
      EventType: event.EventType,
      EventURL: event.EventURL,
      Severity: 0,
      Extras: event.Extras
    };
  }
  return event.DOMContexts.map((context, cidx) => {
    return {
      ContextID: context.ID,
      HTMLLocationType: locationTypes[context.HTMLLocationType],
      HTMLNodeType: context.HTMLNodeType,
      EventContext: context.EventContext,
      RawEvent: event.RawEvent.Data,
      RawEventIndex: cidx,
      EventType: event.EventType,
      EventURL: event.EventURL,
      Severity: context.Severity,
      Reason: context.Reason,
      Extras: event.Extras
    };
  });
};

// isLocalStorage tests if a key is in the localStorage.
const isInLocalStorage = (key, ID) => {
  try {
    return JSON.parse(localStorage.getItem(key)).indexOf(ID) > -1;
  } catch (e) {
    return false;
  }
};

const getSavedProject = () => {
  return localStorage.getItem("project");
};
const saveProject = proj => {
  localStorage.setItem("project", proj);
};

// newTracyNotification checks the browser supports notifications,
// then either asks permission for notifications, or displays the
// formatted notification if the user has already granted permission.
const newTracyNotification = (tracer, context, event) => {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification");
    return;
  }

  if (Notification.permission === "granted") {
    // Let's check whether notification permissions have already been granted
    // If it's okay let's create a notification
    tracyNotification(tracer, context, event);
  } else if (Notification.permission !== "denied") {
    // Otherwise, we need to ask the user for permission
    Notification.requestPermission(permission => {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        tracyNotification(tracer, context, event);
      }
    });
  }
};

// tracyNotification creates a notification with the tracy logo
// and standard default options, such as requiring interaction.
const tracyNotification = (tracer, context, event) => {
  const title = "Tracy found XSS!";
  const body = `Tracer Payload: ${tracer.TracerPayload}
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
  n.onclick = e => {
    const match_t = this.state.ptracers.filter(
      t => t.TracerPayload === tracer.TracerPayload
    );
    if (match_t.length === 1) {
      this.handleTracerSelection(match_t[0], () => {
        const match_e = this.state.pevents.filter(
          e =>
            e.RawEvent === event.RawEvent.Data &&
            e.EventType === event.EventType &&
            e.HTMLNodeType === context.HTMLNodeType
        );

        if (match_e.length === 1) {
          this.handleEventSelection(match_e[0]);
        }
      });
    }
  };
};

const selectedTracerByID = (tracers, id) => {
  return tracers[firstIDByID(tracers, { ID: id })];
};

const selectedEventByID = (events, id) => {
  return events[firstIDByID(events, { ID: id })];
};

const firstIDByID = (s, m) => {
  for (let i = 0; i < s.length; i++) {
    if (m.ID === s[i].ID) {
      return i;
    }
  }
  return -1;
};

export {
  selectedTracerByID,
  selectedEventByID,
  firstIDByID,
  sleep,
  newTracyRequest,
  enumerate,
  parsePath,
  parseHost,
  parseURLParameters,
  parseVisibleEvents,
  newTracyNotification,
  isEmpty,
  isInLocalStorage,
  formatEvent,
  formatRowSeverity,
  formatTracer,
  formatRequest,
  switchProject,
  delProject,
  getProjects,
  getTracers,
  getTracerEvents,
  getSavedProject,
  saveProject,
  reproduce,
  filterTextNodes,
  filterInactive,
  filterResponses
};
