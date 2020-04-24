import { Severity } from "./constants";
// Stolen from : https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
export const generateUUID = () =>
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );

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
  getLastSelectedTable,
  upHandler,
  downHandler
) => {
  const down = [39, 40];
  const up = [37, 38];
  const handler = (event) => {
    if (
      getLastSelectedTable() === tableName &&
      [...down, ...up].includes(event.keyCode)
    ) {
      if (up.includes(event.keyCode)) {
        upHandler();
      } else {
        downHandler();
      }
    }
  };
  document.addEventListener("keydown", handler, { passive: true });
  return () => document.removeEventListener("keydown", handler);
};
