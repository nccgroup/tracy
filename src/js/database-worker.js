import {
  MessageTypes,
  DatabaseQueryType,
  Database,
  Strings,
} from "./shared/constants";
import { substringAround } from "./shared/ui-helpers";
import { prettify } from "./ext/prettyify";
// openDB is a helper function for asyncing the opening of a database.
const openDB = (name, version, onUpgrade) => {
  return new Promise((res, rej) => {
    const db = indexedDB.open(name, version);
    db.onerror = (e) => {
      rej(e);
    };
    db.onsuccess = (e) => {
      res(e.target.result);
    };
    db.onupgradeneeded = (e) =>
      onUpgrade(e.target.result).then((_) => res(e.target.result));
  });
};

// createStore is a helper function for asyncing the creation of an
// objectstore in the indexDB.
const createStore = (db, name, options, onStoreCreate) => {
  return new Promise((res) => {
    const store = db.createObjectStore(name, options);
    if (onStoreCreate) onStoreCreate(store);
    store.transaction.oncomplete = (e) => res(e);
  });
};
// getTracers returns all the tracer objects filtered by the current project
// ID.
const getTracers = async (tracersDB, key) => {
  return await new Promise((res, rej) => {
    const req = tracersDB
      .transaction(Database.TRACERS_TABLE)
      .objectStore(Database.TRACERS_TABLE)
      .index(Database.UUID)
      .openCursor(IDBKeyRange.only(key));

    const tracers = [];

    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const tracer = cursor.value;
        // convert the screenshots to blob URLs
        if (tracer.Screenshot) {
          tracer.Screenshot = URL.createObjectURL(tracer.Screenshot);
        }
        tracers.push(tracer);
        cursor.continue();
      } else {
        // Sort tracers by their creation date
        res(tracers);
      }
    };
    req.onerror = (e) => rej(e);
  });
};
// getTracerByPayload returns a tracer that is keyed with the given tracer payload.
// Since tracer payloads are unique, we shouldn't need to use the UUID index.
const getTracerByPayload = async (tracersDB, tracerPayload) =>
  await new Promise((res, rej) => {
    const req = tracersDB
      .transaction(Database.TRACERS_TABLE)
      .objectStore(Database.TRACERS_TABLE)
      .index(Database.TRACER_PAYLOAD_INDEX)
      .get(tracerPayload);

    req.onsuccess = (e) => res(e.target.result);
    req.onerror = (e) => rej(e);
  });

// getTracerEventsByPayload returns all the tracer events associated with a
// tracer payload.
const getTracerEventsByPayload = async (eventsDB, tracerPayload) =>
  await new Promise((res, rej) => {
    const req = eventsDB
      .transaction(Database.EVENTS_TABLE)
      .objectStore(Database.EVENTS_TABLE)
      .index(Database.JOIN)
      .openCursor(IDBKeyRange.only(tracerPayload));

    const events = [];

    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        // by default, don't get the RawEvents or the RawEventHashes just yet
        delete cursor.value["RawEvent"];
        delete cursor.value["RawEventHash"];
        events.push(cursor.value);
        cursor.continue();
      } else {
        res(events);
      }
    };
    req.onerror = (e) => rej(e);
  });

// getRawEvent returns the raw event for a particular event. These events
// can be large which is why we have a separate call to get them.
const getRawEvent = async (eventsDB, eventID) =>
  await new Promise((res, rej) => {
    const req = eventsDB
      .transaction(Database.EVENTS_TABLE, DatabaseQueryType.READONLY)
      .objectStore(Database.EVENTS_TABLE)
      .get(eventID);

    req.onsuccess = (e) =>
      res(
        URL.createObjectURL(
          new Blob([e.target.result.RawEvent], {
            type: e.target.result.RawEventType,
          })
        )
      );
    req.onerror = (e) => rej(e);
  });

// addTracer adds a tracer to the database.
const addTracer = async (tracersDB, tracer, key) => {
  // Add the API key to the tracer object so we know what project is belongs to.
  tracer[Database.UUID] = key;
  return await new Promise((res, rej) => {
    const req = tracersDB
      .transaction(Database.TRACERS_TABLE, DatabaseQueryType.READWRITE)
      .objectStore(Database.TRACERS_TABLE)
      .put(tracer);

    req.onsuccess = (e) => res(e.target.result);
    req.onerror = (e) => rej(e);
  });
};

// addEvents adds multiple events to the database in one transaction.
const addEvents = async (tracersDB, eventsDB, events) => {
  return await Promise.all(
    events.map(async (event, i) => {
      const [snippet, lineNum] = substringAround(
        event.RawEvent,
        event.TracerPayload,
        500,
        i
      );

      const [prettyEvent, type] = prettify(snippet);
      const te = new TextEncoder();
      const td = new TextDecoder();
      const croppedEvent = te.encode(prettyEvent).buffer;
      const hashBuffer = await crypto.subtle.digest("SHA-1", croppedEvent);
      const hash = td.decode(hashBuffer);
      event.RawEvent = new Blob([croppedEvent], {
        type,
      });
      event.RawEventHash = hash;
      event.RawEventIndex = lineNum;
      try {
        return await addEvent(tracersDB, eventsDB, event);
      } catch (e) {
        if (e.target.error.message.indexOf("unique") !== -1) {
          if (DEV) {
            console.log("Prevented duplicate");
          }
          return {};
        } else {
          console.error(e);
          return {};
        }
      }
    })
  );
};

const updateTracerBasedOnEvent = async (tracersDB, eventsDB, tracerPayload) => {
  let tracer = await getTracerByPayload(tracersDB, tracerPayload);
  return new Promise((res, rej) => {
    const eventsReq = eventsDB
      .transaction(Database.EVENTS_TABLE, DatabaseQueryType.READONLY)
      .objectStore(Database.EVENTS_TABLE)
      .index(Database.JOIN)
      .openCursor(IDBKeyRange.only(tracerPayload));

    const events = [];
    eventsReq.onsuccess = (e) => {
      const cursor = e.target.result;
      // If the cursor is there, we are still collecting
      // all the events.
      if (cursor) {
        events.push(cursor.value);
        cursor.continue();
        return;
      }

      // When it's not, we can start doing something with them.
      if (events.length === 0) {
        res();
        return;
      }
      const highestSev = events.sort((a, b) => a.Severity - b.Severity).pop()
        .Severity;

      // No need to update if there is nothing to update.
      if (tracer.HasTracerEvents && tracer.Severity === highestSev) {
        res();
        return;
      }

      tracer.Severity = highestSev;
      tracer.HasTracerEvents = true;
      addTracer(tracersDB, tracer, tracer[Database.UUID]);
    };
    eventsReq.onerror = (e) => rej(e);
  });
};
// addEvent adds a single event to the database.
const addEvent = async (tracersDB, eventsDB, event) =>
  await new Promise((res, rej) => {
    const req = eventsDB
      .transaction(Database.EVENTS_TABLE, DatabaseQueryType.READWRITE)
      .objectStore(Database.EVENTS_TABLE)
      .add(event);

    req.onsuccess = (e) => {
      updateTracerBasedOnEvent(tracersDB, eventsDB, event.TracerPayload);
      res(e.target.result);
    };
    req.onerror = (e) => rej(e);
  });

const dedupeRequests = (tracer, requests) => {
  const requestsWithIDs = requests.map((r, i) => {
    r.ID = i + 1;
    return r;
  });
  if (Object.keys(tracer).includes("Requests")) {
    const largestID = tracer.Requests.reduce(
      (accum, cur) => (cur.ID > accum ? cur.ID : accum),
      0
    );
    const requestsWithIDsInc = requestsWithIDs.map((r) => {
      r.ID = r.ID + largestID;
      return r;
    });

    return Object.assign({}, tracer, {
      Requests: [...new Set([...tracer.Requests, ...requestsWithIDsInc])],
    });
  }

  return Object.assign({}, tracer, {
    Requests: requestsWithIDs,
  });
};
// addRequestsToTracer adds a request to a tracer object already in the database.
const addRequestsToTracer = async (tracersDB, requests, tracerPayload, key) => {
  const tracer = await getTracerByPayload(tracersDB, tracerPayload);

  const update = dedupeRequests(tracer, requests);
  return await addTracer(tracersDB, update, update[Database.UUID]);
};

const initDBClient = () => {
  let tracersDB;
  let eventsDB;

  const version = 3;

  return async () => {
    if (tracersDB && eventsDB) {
      return { tracersDB, eventsDB };
    }
    tracersDB = await openDB(
      Database.TRACERS_TABLE,
      version,
      async (db) =>
        await createStore(
          db,
          Database.TRACERS_TABLE,
          { keyPath: "ID", autoIncrement: true },
          (store) => {
            store.createIndex(Database.TRACER_PAYLOAD_INDEX, Database.JOIN, {
              unique: true,
            });
            store.createIndex(Database.UUID, Database.UUID, { unique: false });
          }
        )
    );
    eventsDB = await openDB(
      Database.EVENTS_TABLE,
      version,
      async (db) =>
        await createStore(
          db,
          Database.EVENTS_TABLE,
          { keyPath: "ID", autoIncrement: true },
          (store) => {
            // Index on events' tracer payload so we can group these store together.
            store.createIndex(Database.JOIN, Database.JOIN, { unique: false });
            // We want to use the key path to dedupe the events. The RawEvent and
            // TracerPayload should be unique across all the data.
            store.createIndex(
              Database.RAW_EVENT_INDEX,
              ["RawEventHash", "RawEventIndex", Database.JOIN],
              { unique: true }
            );
          }
        )
    );

    return { tracersDB, eventsDB };
  };
};

const dbRouter = async (e, tracersDB, eventsDB) => {
  const { query } = e.data;
  switch (query) {
    case MessageTypes.GetTracers.query:
      return await getTracers(tracersDB, e.data.key);
    case MessageTypes.GetRawEvent.query:
      const { eventID } = e.data;
      return await getRawEvent(eventsDB, eventID);
    case MessageTypes.GetTracerEventsByPayload.query:
      return await getTracerEventsByPayload(eventsDB, e.data.tracerPayload);
    case MessageTypes.GetTracersByPayload.query:
      return await getTracerByPayload(tracersDB, e.data.tracerPayload);
    case MessageTypes.AddTracer.query:
      return await addTracer(tracersDB, e.data.tracer, e.data.key);
    case MessageTypes.AddEvents.query:
      return await addEvents(tracersDB, eventsDB, e.data.events);
    case MessageTypes.AddRequestsToTracer.query:
      return await addRequestsToTracer(
        tracersDB,
        e.data.requests,
        e.data.tracerPayload
      );
    default:
      console.error(
        `[WORKER]: Unrecognized database query request "${query} -> ${e}"`
      );
      return await Promise.resolve({});
  }
};

const client = initDBClient();
onmessage = async (e) => {
  const { chan } = e.data;
  let t1;
  if (DEV) {
    t1 = performance.now();
  }
  let msg;
  try {
    const { tracersDB, eventsDB } = await client();
    if (DEV) {
      console.log("[QUERY] [WORKER]", e.data.query);
    }
    msg = await dbRouter(e, tracersDB, eventsDB);

    postMessage({ data: msg, chan });
  } catch (e) {
    if (e.target) {
      msg = e.target.error;
    } else {
      msg = e;
    }
    if (DEV) {
      console.error("[WORKER]", msg);
    }
    postMessage({ data: msg, chan, error: true });
  } finally {
    if (DEV) {
      const t2 = performance.now();
      console.log("[QUERY-DONE] [WORKER]", e.data.query, t2 - t1);
    }
  }
};
