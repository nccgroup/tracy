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

  const version = 1;
  const join = "TracerPayload";
  const tracersTable = "tracers";
  const eventsTable = "events";
  let tracersDB;
  let eventsDB;

  const getAllTracers = async () =>
    await new Promise((res, rej) => {
      const req = tracersDB
        .transaction(tracersTable)
        .objectStore(tracersTable)
        .getAll();

      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e);
    });

  const getTracerByPayload = async tracerPayload =>
    await new Promise((res, rej) => {
      const req = tracersDB
        .transaction(tracersTable)
        .objectStore(tracersTable)
        .get(tracerPayload);

      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e);
    });

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

  const addTracer = async tracer =>
    await new Promise((res, rej) => {
      const req = tracersDB
        .transaction(tracersTable, "readwrite")
        .objectStore(tracersTable)
        .add(tracer);

      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e);
    });

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

  const addEventToTracer = async event =>
    await new Promise((res, rej) => {
      const req = eventsDB
        .transaction(eventsTable, "readwrite")
        .objectStore(eventsTable)
        .add(event);

      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e);
    });
  const addEventsToTracer = async events =>
    await new Promise((res, rej) => {
      const store = tracersDB
        .transaction(tracersTable, "readwrite")
        .objectStore(tracersTable);

      // Wait for all the writes to finish
      Promise.all(
        events.map(e => {
          return new Promise((done, err) => {
            const req = store.add(e);
            req.onsuccess = e => done(e);
            req.onerror = e => err(e);
          });
        })
      )
        .then(e => res(e))
        .catch(e => rej(e));
    });

  (async () => {
    try {
      tracersDB = await openDB(tracersTable, version, async db => {
        return await createStore(db, tracersTable, { keyPath: join });
      });
      console.log(tracersDB);
      eventsDB = await openDB(eventsTable, version, async db => {
        return await createStore(
          db,
          eventsTable,
          { autoIncrement: true },
          store => {
            // Index on events' tracer payload so we can group these store together.
            store.createIndex(join, join, { unique: false });
          }
        );
      });
      console.log(eventsDB);
    } catch (e) {
      console.error(e);
    }
  })();

  return {
    getAllTracers: getAllTracers,
    getTracerByPayload: getTracerByPayload,
    getTracerEventsByPayload: getTracerEventsByPayload,
    addTracer: addTracer,
    addRequestToTracer: addRequestToTracer,
    addEventToTracer: addEventToTracer,
    addEventsToTracer: addEventsToTracer
  };
})();
