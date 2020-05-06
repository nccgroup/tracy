import { Severity, Strings } from "./constants";

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

export const sleep = (time) => {
  return new Promise((res) => setTimeout(res, time));
};

const uniqueStr = "zzFINDMEzz";
export const substringAround = (str, substr, padding, instance) => {
  const instances = str.split(substr);
  if (instances.length === 1) {
    return "";
  }

  if (instance + 1 > instances.length - 1) {
    console.error(
      `Requesting too many instances ${instance} of ${substr} in ${str}`
    );
    return "";
  }

  // go back until we have no more instances or the length of the left side
  // is greater than or equal to the padding
  let leftPad = "";
  for (let i = instance; leftPad.length < padding && i >= 0; i--) {
    leftPad = instances[i] + substr + leftPad;
  }
  // then truncate the padding
  leftPad = leftPad.substring(leftPad.length - padding, leftPad.length);

  let rightPad = "";
  for (
    let i = instance + 1;
    rightPad.length < padding && i < instances.length;
    i++
  ) {
    rightPad += instances[i] + substr;
  }
  // remove the last substr
  rightPad = rightPad.substring(0, rightPad.length - substr.length);
  rightPad = rightPad.substring(0, padding);

  const snippet = leftPad + uniqueStr + rightPad;

  const lineNum = snippet
    .split("\n")
    .map((l, i) => (l.indexOf(uniqueStr) !== -1 ? i + 1 : null))
    .filter(Boolean)
    .pop();

  return [snippet.replace(uniqueStr, ""), lineNum];
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

export const printSize = (buffer, location, filter = 100) => {
  if (false) {
    let len;
    if (!buffer) {
      len = 0;
    } else {
      len = JSON.stringify(buffer).length;
    }

    console.log(location, len);
    if (len > filter) {
      console.log(`[${location}-DETAIL]`, buffer);
    }
  }
};

export const getElementByNameAndValue = (name, value) => {
  const elems = [...document.getElementsByName(name)]
    .filter(
      (n) =>
        n.nodeName.toLowerCase() === Strings.INPUT ||
        n.nodeName.toLowerCase() === Strings.TEXT_AREA
    )
    .filter((n) => value === n.value);
  if (elems.length !== 1) {
    return null;
  }
  return elems.pop();
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
