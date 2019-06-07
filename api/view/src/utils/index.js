import { store } from "../index";

// sleep returns a promise that is resolved after the provided number of ms.
export const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// newTracyRequest generates a request object that should be used with
// the tracy API.
export const newTracyRequest = async (path, opts) => {
  while (true) {
    const state = store.getState();
    if (!opts.headers) {
      opts.headers = {};
    }
    opts.headers.Hoot = state.apiKey;
    return new Request(
      `http://${state.tracyHost}:${state.tracyPort}/api/tracy${path}`,
      opts
    );
  }
};

// reproduce sends the API request to trigger a reproduction.
export const reproduce = async (tracerID, contextID) => {
  return await retryRequest(
    newTracyRequest(`/tracers/${tracerID}/events/${contextID}/reproductions`, {
      method: "POST"
    })
  );
};

// getTracerEvents gets the bulk events via an HTTP GET request.
export const getTracerEvents = async tracerID => {
  return await retryRequest(
    newTracyRequest(`/tracers/${tracerID}/events`, {
      method: "GET"
    })
  );
};

// getTracers gets the bulk tracers via an HTTP GET request.
export const getTracers = async () => {
  return await retryRequest(
    newTracyRequest(`/tracers`, {
      method: "GET"
    })
  );
};

// getProjects gets the projects available to view.
export const getProjects = async () => {
  return await retryRequest(
    newTracyRequest(`/projects`, {
      method: "GET"
    })
  );
};

// delProject issues an API request to delete a project from disk.
export const delProject = async proj => {
  return await retryRequest(
    newTracyRequest(`/projects?proj=${proj}`, {
      method: "DELETE"
    })
  );
};

// switchProject makes the API request to switch projects.
export const switchProject = async proj => {
  return await retryRequest(
    this.newTracyRequest(`/projects?proj=${proj}`, {
      method: "PUT"
    })
  );
};

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

// parseURLParameters returns the URL query parameters of a url as a
// comma-separated list.
export const parseURLParameters = url => {
  const splitOnParam = url.split("?");
  if (splitOnParam.length <= 0) {
    return "";
  }
  return splitOnParam[1].replace("&", ", ");
};

// parseHost returns the hostname from a URL.
export const parseHost = url => {
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
export const parsePath = url => {
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

// parseVisibleEvents converts raw events from the API into events that can be
// read by the table.
export const parseVisibleEvents = (events = [], sfilters = []) => {
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

export const formatRowSeverity = (row, rowIdx) => {
  return severity[row.OverallSeverity];
};

// formatEvent formats an event context into its corresponding columns.
export const formatEvent = event => {
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
export const isInLocalStorage = (key, ID) => {
  try {
    return JSON.parse(localStorage.getItem(key)).indexOf(ID) > -1;
  } catch (e) {
    return false;
  }
};

export const getSavedProject = () => localStorage.getItem("project");
export const saveProject = proj => localStorage.setItem("project", proj);

// newTracyNotification checks the browser supports notifications,
// then either asks permission for notifications, or displays the
// formatted notification if the user has already granted permission.
export const newTracyNotification = (tracer, context, event) => {
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
export const tracyNotification = (tracer, context, event) => {
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

export const firstElemByID = (elems, id) => {
  if (id < 0) return { ID: id };
  const idt = firstIDByID(elems, { ID: id });
  if (idt < 0) return { ID: idt };
  return elems[idt];
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
