const database = (() => {
  const openDB = (name, version, onUpgrade) => {
    return new Promise((res, rej) => {
      const db = window.indexedDB.open(name, version);
      db.onerror = e => {
        rej(e);
      };
      db.onsuccess = e => {
        res(e.target.result);
      };
      db.onupgradeneeded = e =>
        onUpgrade(e.target.result).then(_ => res(e.target.result));
    });
  };
  const createStore = (db, name, options, onStoreCreate) => {
    return new Promise(res => {
      const store = db.createObjectStore(name, options);
      if (onStoreCreate) onStoreCreate(store);
      store.transaction.oncomplete = e => res(e);
    });
  };

  const version = 2;
  const join = "TracerPayload";
  const tracersTable = "tracers";
  const eventsTable = "events";
  const uuid = "UUID";
  let tracersDB;
  let eventsDB;

  // getTracers returns all the tracer objects filtered by the current project ID
  const getTracers = async () => {
    const key = await settings.getAPIKey();
    return await new Promise((res, rej) => {
      const req = tracersDB
        .transaction(tracersTable)
        .objectStore(tracersTable)
        .index(uuid)
        .openCursor(IDBKeyRange.only(key));

      const tracers = [];

      req.onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
          tracers.push(cursor.value);
          cursor.continue();
        } else {
          res(tracers);
        }
      };
      req.onerror = e => rej(e);
    });
  };
  // getTracerByPayload returns a tracer that is keyed with the given tracer payload.
  // Since tracer payloads are unique, we shouldn't need to use the UUID index.
  const getTracerByPayload = async tracerPayload =>
    await new Promise((res, rej) => {
      const req = tracersDB
        .transaction(tracersTable)
        .objectStore(tracersTable)
        .get(tracerPayload);

      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e);
    });

  // getTracerEventsByPayload returns all the tracer events associated with a
  // tracer payload.
  const getTracerEventsByPayload = async tracerPayload =>
    await new Promise((res, rej) => {
      const req = eventsDB
        .transaction(eventsDB)
        .objectStore(eventsDB)
        .index(join)
        .get(tracerPayload);

      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e);
    });

  // addTracer adds a tracer to the database.
  const addTracer = async tracer => {
    // Add the API key to the tracer object so we know what project is belongs to.
    tracer[uuid] = await settings.getAPIKey();
    return await new Promise((res, rej) => {
      const req = tracersDB
        .transaction(tracersTable, "readwrite")
        .objectStore(tracersTable)
        .put(tracer);

      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e);
    });
  };

  // addRequestToTracer adds a request to a tracer object already in the database.
  const addRequestToTracer = async (request, tracerPayload) =>
    await new Promise((res, rej) => {
      const store = tracersDB
        .transaction(tracersTable, "readwrite")
        .objectStore(tracersTable);

      const req = store.get(tracerPayload);
      req.onsuccess = e => {
        const update = store.put(e.target.result.Requests.concat(request));
        update.onerror = e => rej(e);
        update.onsuccess = e => res(e);
      };
      req.onerror = e => rej(e);
    });

  // addEvent adds a single event to the database.
  const addEvent = async event =>
    await new Promise((res, rej) => {
      const req = eventsDB
        .transaction(eventsTable, "readwrite")
        .objectStore(eventsTable)
        .put(event);

      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e);
    });

  (async () => {
    try {
      tracersDB = await openDB(tracersTable, version, async db => {
        return await createStore(db, tracersTable, { keyPath: join }, store => {
          store.createIndex(uuid, uuid, { unique: false });
        });
      });
      eventsDB = await openDB(eventsTable, version, async db => {
        return await createStore(
          db,
          eventsTable,
          { keyPath: ["RawEvent", "TracerPayload"] },
          store => {
            // Index on events' tracer payload so we can group these store together.
            store.createIndex(join, join, { unique: false });
          }
        );
      });
    } catch (e) {
      console.error(e);
    }
  })();

  return {
    getTracers: getTracers,
    getTracerByPayload: getTracerByPayload,
    getTracerEventsByPayload: getTracerEventsByPayload,
    addTracer: addTracer,
    addRequestToTracer: addRequestToTracer,
    addEvent: addEvent
  };
})();
