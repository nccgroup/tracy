import { Severity } from "./constants";

export const firstIDByID = (s, m) => {
  if (m.ID < 0) return -1;
  for (let i = 0; i < s.length; i++) {
    if (m.ID === s[i].ID) {
      return i;
    }
  }
  return -1;
};
// sleep returns a promise that is resolved after the provided number of ms.
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// enumerate assigns an object an ID property.
export const enumerate = (event, id) => {
  event.ID = id + 1;

  return event;
};

// filterResponses filters out events that have the event type of response.
export const filterResponses = (context) => {
  return context.EventType.toLowerCase() !== "http response";
};

// filterInactive filters out tracers that have no events or contexts.
export const filterInactive = (tracer) => tracer.HasTracerEvents;

// filterTextNodes filters out events that are text nodes.
export const filterTextNodes = (context) =>
  context.EventType.toLowerCase() !== "text";

// filterReferrer filters out HTTP requests that have a tracer string in a referrer header
export const filterReferers = (tracer) => (request) => {
  const refRequests = request.RawRequest.toLowerCase()
    .split("\n")
    .filter((line) => line.startsWith("refer"));
  if (refRequests.length === 0) {
    return true;
  }
  return refRequests.pop().split(":").pop().trim().indexOf(tracer) === -1;
};

export const formatRowSeverity = (row) => {
  return Severity[row.Severity];
};

// mod is a helper mod function if you are dealing with negative
// numbers such as page table flips (when you flip the first page left,
// the page index will be -1 which doesn't work well with mod)
export const mod = (x, n) => ((x % n) + n) % n;
export const createKeyDownHandler = (
  tableName,
  lastSelectedTable,
  upHandler,
  downHandler
) => {
  const down = [39, 40];
  const up = [37, 38];
  document.addEventListener("keydown", (event) => {
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
