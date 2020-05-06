import { MessageTypes, EventTypes } from "../shared/constants";
import { newPromiseMap } from "../shared/promise-map";
import { settings } from "./settings";
import { sleep } from "../shared/ui-helpers";

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
    case MessageTypes.GetRawEvent.query:
      const { eventID } = message;
      return await getRawEvent(eventID);
    default:
      return await Promise.resolve("BAD");
  }
};

const sendQuery = (message, worker) => {
  return new Promise((res, rej) => {
    const chan = promiseMap.add(res, rej);
    worker.postMessage({ ...message, chan });
  });
};
const dbURL = chrome.runtime.getURL("databaseWorker.bundle.js");
const dbWriters = [new Worker(dbURL), new Worker(dbURL), new Worker(dbURL)];
const dbReaders = [new Worker(dbURL), new Worker(dbURL), new Worker(dbURL)];

const pickDBReader = ((dbReaders) => {
  let i = 0;

  return () => {
    const id = i++ % dbReaders.length;
    return dbReaders[id];
  };
})(dbReaders);

const pickDBWriter = ((dbWriters) => {
  let i = 0;

  return () => {
    const id = i++ % dbWriters.length;
    return dbWriters[id];
  };
})(dbWriters);

const promiseMap = newPromiseMap("database");
const dbHandler = (e) => {
  const { data, chan, error } = e.data;
  if (error) {
    promiseMap.reject(data, chan);
  } else {
    promiseMap.resolve(data, chan);
  }
};

dbWriters.map((dbw) =>
  dbw.addEventListener(EventTypes.Message, dbHandler, { passive: true })
);
dbReaders.map((dbr) =>
  dbr.addEventListener(EventTypes.Message, dbHandler, { passive: true })
);

export const addTracer = async (tracer) => {
  const dbWriter = pickDBWriter();
  return await sendQuery(
    {
      ...MessageTypes.AddTracer,
      tracer,
      key: await settings.getAPIKey(),
    },
    dbWriter
  );
};
export const addEvents = async (events) => {
  const dbWriter = pickDBWriter();
  return await sendQuery({ ...MessageTypes.AddEvents, events }, dbWriter);
};
export const addEvent = async (event) => {
  const dbWriter = pickDBWriter();
  return await sendQuery({ ...MessageTypes.AddEvent, event }, dbWriter);
};
export const addRequestsToTracer = async (requests, tracerPayload) => {
  const dbWriter = pickDBWriter();
  return await sendQuery(
    {
      ...MessageTypes.AddRequestsToTracer,
      requests,
      tracerPayload,
    },
    dbWriter
  );
};

export const getTracerEventsByPayload = async (tracerPayload) => {
  const dbReader = pickDBReader();
  return await sendQuery(
    { ...MessageTypes.GetTracerEventsByPayload, tracerPayload },
    dbReader
  );
};
export const getRawEvent = async (eventID) => {
  const dbReader = pickDBReader();
  return await sendQuery({ ...MessageTypes.GetRawEvent, eventID }, dbReader);
};

export const getTracers = (() => {
  let tracers = [];
  setInterval(async () => {
    const dbReader = pickDBReader();
    tracers = sendQuery(
      { ...MessageTypes.GetTracers, key: await settings.getAPIKey() },
      dbReader
    );
  }, 2000);
  return async (delay = 0) => {
    if (delay > 0) {
      await sleep(delay);
    }
    return tracers;
  };
})();

export const getTracerByPayload = async (tracerPayload) => {
  const dbReader = pickDBReader();
  return await sendQuery(
    { ...MessageTypes.GetTracerByPayload, tracerPayload },
    dbReader
  );
};
