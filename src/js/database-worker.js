import { MessageTypes, DatabaseQueryType, Database } from "./shared/constants";

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

// getTracersDelayed gets all the tracers after a given
// delay period.
const getTracersDelayed = (tracersDB, delay = 500) => {
  return new Promise((res, rej) => {
    setTimeout(async () => {
      try {
        const tracers = await getTracers(tracersDB);
        res(tracers);
      } catch (e) {
        rej(e);
      }
    }, delay);
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
        tracers.push(cursor.value);
        cursor.continue();
      } else {
        // Sort tracers by their creation date
        res(tracers.sort((a, b) => a.Created - b.Created));
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
        events.push(cursor.value);
        cursor.continue();
      } else {
        res(events);
      }
    };
    req.onerror = (e) => rej(e);
  });

// addTracer adds a tracer to the database.
const addTracer = async (tracersDB, tracer, key) => {
  // Add the API key to the tracer object so we know what project is belongs to.
  tracer[Database.UUID] = key;
  tracer.Created = Date.now();
  return await new Promise((res, rej) => {
    const req = tracersDB
      .transaction(Database.TRACERS_TABLE, DatabaseQueryType.READWRITE)
      .objectStore(Database.TRACERS_TABLE)
      .put(tracer);

    req.onsuccess = (e) => {
      res(e.target.result);
    };
    req.onerror = (e) => rej(e);
  });
};

// addEvents adds multiple events to the database in one transaction.
const addEvents = async (tracersDB, eventsDB, events) =>
  await new Promise((res, rej) => {
    // Get a database transaction
    const tx = eventsDB.transaction(
      Database.EVENTS_TABLE,
      DatabaseQueryType.READWRITE
    );
    // For each of the events, use the transaction to open the
    // store and add an event.
    const eventsWritten = [];
    events.map((event) => {
      const req = tx.objectStore(Database.EVENTS_TABLE).add(event);
      req.onerror = (e) => {
        e.preventDefault();
      };
      req.onsuccess = (e) => {
        eventsWritten.push(event);
      };
    });

    tx.oncomplete = (e) => {
      eventsWritten.map((e) =>
        updateTracerBasedOnEvent(tracersDB, eventsDB, e.TracerPayload)
      );
      res(e.target.result);
    };
    tx.onerror = (e) => {
      e.preventDefault();
    };

    tx.onabort = (e) => {
      rej(e);
    };
  });

const updateTracerBasedOnEvent = async (tracersDB, eventsDB, tracerPayload) => {
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
      const tracersReq = tracersDB
        .transaction(Database.TRACERS_TABLE, DatabaseQueryType.READWRITE)
        .objectStore(Database.TRACERS_TABLE)
        .openCursor(IDBKeyRange.only(tracerPayload));

      tracersReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (!cursor) {
          res();
          return;
        }

        const tracer = cursor.value;
        // No need to update if there is nothing to update.
        if (tracer.HasTracerEvents && tracer.Severity === highestSev) {
          res();
          return;
        }

        tracer.Severity = highestSev;
        tracer.HasTracerEvents = true;
        const upReq = cursor.update(tracer);
        upReq.onsuccess = (e) => {
          res(e);
        };
        upReq.onerror = (e) => rej(e);
      };
      tracersReq.onerror = (e) => rej(e);
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

// addRequestsToTracer adds a request to a tracer object already in the database.
const addRequestsToTracer = async (tracersDB, requests, tracerPayload) => {
  return new Promise((res, rej) => {
    const req = tracersDB
      .transaction(Database.TRACERS_TABLE, DatabaseQueryType.READWRITE)
      .objectStore(Database.TRACERS_TABLE)
      .openCursor(IDBKeyRange.only(tracerPayload));

    req.onsuccess = (e) => {
      const cursor = e.target.result;
      let up;
      if (!cursor) return;
      const tracer = cursor.value;
      if (Object.keys(tracer).includes("Requests")) {
        // Make sure these requests are unique. If any of the raw requests
        // are the same, we don't need to make any changes.
        const dupes = requests
          .map((re) =>
            tracer.Requests.filter(
              (r) => r.RawRequest.trim() === re.RawRequest.trim()
            )
          )
          .flat()
          .filter((r) => r.length > 0);
        if (dupes.length > 0) {
          res(true);
          return;
        }

        up = Object.assign({}, tracer, {
          Requests: tracer.Requests.concat(requests),
        });
      } else {
        up = Object.assign({}, tracer, {
          Requests: requests,
        });
      }

      const upreq = cursor.update(up);
      upreq.onsuccess = (e) => res(e.target.result);
      upreq.onerror = (e) => rej(e);
    };

    req.onerror = (e) => rej(e);
  });
};

const initDBClient = () => {
  let tracersDB;
  let eventsDB;

  const version = 2;

  return async () => {
    if (tracersDB && eventsDB) {
      return { tracersDB, eventsDB };
    }
    tracersDB = await openDB(Database.TRACERS_TABLE, version, async (db) => {
      return await createStore(
        db,
        Database.TRACERS_TABLE,
        { keyPath: Database.JOIN },
        (store) => {
          store.createIndex(Database.UUID, Database.UUID, { unique: false });
        }
      );
    });
    eventsDB = await openDB(Database.EVENTS_TABLE, version, async (db) => {
      return await createStore(
        db,
        Database.EVENTS_TABLE,
        // We want to use the key path to dedupe the events. The RawEvent and
        // TracerPayload should be unique across all the data.
        { keyPath: ["RawEvent", "RawEventIndex", Database.JOIN] },
        (store) => {
          // Index on events' tracer payload so we can group these store together.
          store.createIndex(Database.JOIN, Database.JOIN, { unique: false });
        }
      );
    });

    return { tracersDB, eventsDB };
  };
};

const dbRouter = async (e, tracersDB, eventsDB) => {
  const { query } = e.data;
  switch (query) {
    case MessageTypes.GetTracers.query:
      return await getTracers(tracersDB, e.data.key);
    case MessageTypes.GetTracerEventsByPayload.query:
      return await getTracerEventsByPayload(eventsDB, e.data.tracerPayload);
    case MessageTypes.GetTracersByPayload.query:
      return await getTracerByPayload(tracersDB, e.data.tracerPayload);
    case MessageTypes.AddTracer.query:
      return await addTracer(tracersDB, e.data.tracer, e.data.key);
    case MessageTypes.AddEvents.query:
      return await addEvents(tracersDB, eventsDB, e.data.events);
    case MessageTypes.AddEvent.query:
      return await addEvent(tracersDB, eventsDB, e.data.event);
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
  let msg;
  try {
    const { tracersDB, eventsDB } = await client();
    msg = await dbRouter(e, tracersDB, eventsDB);
  } catch (e) {
    console.error("[WORKER]", e);
    msg = e;
  }
  postMessage({ data: msg, chan });
};
