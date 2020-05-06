const searchPayloadsInMsg = (payloads, msg) => {
  return payloads.filter((p) => msg.indexOf(p) !== -1);
};

const formatTracerEvent = (domEvent, t) => {
  return {
    RawEvent: domEvent.msg,
    EventURL: domEvent.location,
    EventType: domEvent.type,
    TracerPayload: t,
  };
};

// search takes the current set of jobs from the page, filters them
// against the current set of tracer payloads, and sends them as a batch API
// request to the API. Events should contain a list of DOM events.
export const search = (domEvents, tracerPayloads) => {
  return domEvents.reduce((sinks, domEvent) => {
    // Some websites seem to not always write strings to the DOM. In those cases,
    // we don't care about searching.
    let msg = domEvent.msg;
    if (typeof msg !== "string") {
      return sinks;
    }

    // Each DOM write could have many tracer strings in it. Group these together.
    const tracersPerDomEvent = searchPayloadsInMsg(
      tracerPayloads,
      msg.toLowerCase()
    );
    // If no tracers were found in the event, release the Blob URL
    // since we don't need it anymore.
    if (tracersPerDomEvent.length === 0) {
      return sinks;
    }

    // After collecting all the tracers per DOM event, add this DOM event to the
    // list of filtered DOM events that will be submitted in bulk to the event API.
    return [
      ...sinks,
      ...tracersPerDomEvent.map((t) => formatTracerEvent(domEvent, t)),
    ];
  }, []);
};
