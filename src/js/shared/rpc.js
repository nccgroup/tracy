import { MessageTypes } from "./constants";
export const newTracer = (tracer) =>
  Object.assign(
    {},
    { Requests: [], Severity: 0, HasTracerEvents: false, Screenshot: null },
    tracer
  );
export const rpc = (channel) => {
  const addTracer = async (tracer) =>
    await channel.send({
      tracer: newTracer(tracer),
      ...MessageTypes.AddTracer,
    });

  const getRawEvent = async (eventID) =>
    await channel.send({
      ...MessageTypes.GetRawEvent,
      eventID,
    });

  const captureScreenshot = async (dim, tracer) =>
    await channel.send({ ...MessageTypes.Screenshot, dim, tracer });

  const addInnerHTMLJob = async (msg, location) =>
    await channel.send({
      ...MessageTypes.InnerHTML,
      msg,
      location,
    });

  const addDOMJob = async (msg, type, location) =>
    await channel.send({
      ...MessageTypes.DOMJob,
      msg,
      location,
      type,
    });

  const getTracerStrings = async () =>
    await channel.send(MessageTypes.GetTracerStrings);

  const simulateReactValueTracker = async (
    newValue,
    oldValue,
    nodeName,
    id,
    name
  ) => {
    return await channel.sendResponse(
      { newValue, oldValue },
      `${nodeName}:${id}:${name}`
    );
  };

  const getTracers = async () => await channel.send(MessageTypes.GetTracers);
  const getTracerEventsByPayload = async (tracerPayload) =>
    await channel.send({
      ...MessageTypes.GetTracerEventsByPayload,
      tracerPayload: tracerPayload,
    });

  return {
    addTracer,
    getTracerStrings,
    captureScreenshot,
    addDOMJob,
    addInnerHTMLJob,
    getTracers,
    getTracerEventsByPayload,
    simulateReactValueTracker,
    getRawEvent,
  };
};
