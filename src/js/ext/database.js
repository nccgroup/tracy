import { MessageTypes, EventTypes } from "../shared/constants";
import { newPromiseMap } from "../shared/promise-map";
import { settings } from "./settings";
import { wrap } from "lodash";

export const databaseQuery = async (message) => {
  const { query } = message;
  switch (query) {
    case MessageTypes.GetTracers.query:
      return await getTracers();
    case MessageTypes.GetTracerEventsByPayload.query:
      const { tracerPayload } = message;
      return await getTracerEventsByPayload(tracerPayload);
    case MessageTypes.AddTracer.query:
      const { tracer } = message;
      return await addTracer(tracer);
    default:
      console.log("[BAD MESSAGE QUERY]", query);
      return await Promise.resolve("BAD");
  }
};

const sendQuery = (message, worker) => {
  return new Promise((res) => {
    const chan = promiseMap.add(res);
    worker.postMessage({ ...message, chan });
  });
};
const dbURL = chrome.runtime.getURL("databaseWorker.bundle.js");
const dbWriter = new Worker(dbURL);
const dbReader = new Worker(dbURL);

const promiseMap = newPromiseMap();
const dbHandler = async (e) => promiseMap.resolve(e.data.data, e.data.chan);

dbReader.addEventListener(EventTypes.Message, dbHandler, { passive: true });
dbWriter.addEventListener(EventTypes.Message, dbHandler, { passive: true });

export const addTracer = async (tracer) =>
  await sendQuery(
    {
      ...MessageTypes.AddTracer,
      tracer,
      key: await settings.getAPIKey(),
    },
    dbWriter
  );
export const addEvents = async (events) =>
  await sendQuery({ ...MessageTypes.AddEvents, events }, dbWriter);
export const addEvent = async (event) =>
  await sendQuery({ ...MessageTypes.AddEvent, event }, dbWriter);
export const addRequestsToTracer = async (requests, tracerPayload) =>
  await sendQuery(
    {
      ...MessageTypes.AddRequestsToTracer,
      requests,
      tracerPayload,
    },
    dbWriter
  );

const ttl = (time) => {
  let cache = null;
  let last = new Date();
  return async (og) => {
    const timeDiff = Math.round((new Date() - last) / 1000);
    if (cache && timeDiff < time) {
      return cache;
    } else {
      cache = await og();
      last = new Date();
      return cache;
    }
  };
};

export const getTracerEventsByPayload = async (tracerPayload) =>
  await sendQuery(
    { ...MessageTypes.GetTracerEventsByPayload, tracerPayload },
    dbReader
  );

export const getTracers = wrap(
  async () =>
    await sendQuery(
      {
        ...MessageTypes.GetTracers,
        key: await settings.getAPIKey(),
      },
      dbReader
    ),
  ttl(5)
);

export const getTracerByPayload = async (tracerPayload) =>
  await sendQuery(
    { ...MessageTypes.GetTracerByPayload, tracerPayload },
    dbReader
  );
