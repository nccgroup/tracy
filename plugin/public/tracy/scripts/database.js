const database = (() => {
  // Long-lived connection to the web app so we can send it notifications
  // whenever data changes in the database
  let ports = [];
  chrome.runtime.onConnect.addListener(port => {
    ports = [...ports, port];
  });

  // publish takes all the ports that are currently connected and
  // publishes the message.
  const publish = msg => {
    ports = ports
      .map(p => {
        try {
          p.postMessage(msg);
          return p;
        } catch (e) {
          return false;
        }
      })
      .filter(Boolean);
  };

  // openDB is a helper function for asyncing the opening of a database.
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

  // createStore is a helper function for asyncing the creation of an
  // objectstore in the indexDB.
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

  const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const promiseMap = {};

  // Wait for any alarms that are triggered from a delayed tracer call.
  chrome.alarms.onAlarm.addListener(async alarm => {
    if (!alarm.name.startsWith("deliver-")) {
      return;
    }
    // Get the promise associated with this alarm and deliver
    // the current set of tracer payloads for it.
    const rand = alarm.name.split("deliver-")[1];
    const { resolve, reject } = promiseMap[rand];
    // Call the resolution function with whatever tracers are in the database.
    let tracers;
    try {
      tracers = await getTracers();
    } catch (e) {
      // If we have issues getting the tracers, inform the caller.
      reject(e);
      // Delete the promise from the promise map.
      delete promiseMap[rand];
      return;
    }
    resolve(tracers);
    // Delete the promise from the promise map.
    delete promiseMap[rand];
  });

  // getTracersDelayed gets all the tracers after a given
  // delay period.
  const getTracersDelayed = (delay = 500) => {
    return new Promise((res, rej) => {
      // Generate a random identifier so that we can resolve
      // our resolution function whenever the alarm below
      // fires off.
      const rand = getRandomInt(0, 1000000000);
      // Store the random identifier and the resolution function
      // for this promise in the promise map.
      promiseMap[`${rand}`] = { resolve: res, reject: rej };
      // Create an alarm to go off in `delay` time.
      chrome.alarms.create(`deliver-${rand}`, {
        when: Date.now() + delay
      });
    });
  };

  // getTracers returns all the tracer objects filtered by the current project
  // ID.
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
          // Sort tracers by their creation date
          res(tracers.sort((a, b) => a.Created - b.Created));
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
        .transaction(eventsTable)
        .objectStore(eventsTable)
        .index(join)
        .openCursor(IDBKeyRange.only(tracerPayload));

      const events = [];

      req.onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
          events.push(cursor.value);
          cursor.continue();
        } else {
          res(events);
        }
      };
      req.onerror = e => rej(e);
    });

  // addTracer adds a tracer to the database.
  const addTracer = async tracer => {
    // Add the API key to the tracer object so we know what project is belongs to.
    tracer[uuid] = await settings.getAPIKey();
    tracer.Created = Date.now();
    return await new Promise((res, rej) => {
      const req = tracersDB
        .transaction(tracersTable, "readwrite")
        .objectStore(tracersTable)
        .put(tracer);

      req.onsuccess = e => {
        publish({ addTracer: tracer });
        res(e.target.result);
      };
      req.onerror = e => rej(e);
    });
  };

  // addRequestToTracer adds a request to a tracer object already in the database.
  const addRequestToTracer = async (request, tracerPayload) => {
    // Get the tracer we are updating.
    let tracer;
    try {
      tracer = await getTracerByPayload(tracerPayload);
    } catch (e) {
      throw e;
    }

    return await new Promise((res, rej) => {
      // Create a new tracer object based on the old one, but with the
      // new request object added.
      let up;
      if (Object.keys(tracer).includes("Requests")) {
        // Make sure these requests are unique. If any of the raw requests
        // are the same, we don't need to make any changes.
        const dupes = tracer.Requests.filter(
          r => r.RawRequest.trim() === request.RawRequest.trim()
        );
        if (dupes.length > 0) {
          res(true);
          return;
        }

        up = Object.assign({}, tracer, {
          Requests: tracer.Requests.concat(request)
        });
      } else {
        up = Object.assign({}, tracer, {
          Requests: [request]
        });
      }

      // Write the update.
      const req = tracersDB
        .transaction(tracersTable, "readwrite")
        .objectStore(tracersTable)
        .put(up);

      req.onerror = e => rej(e);
      req.onsuccess = e => {
        publish({
          addRequestToTracer: { request: request, tracerPayload: tracerPayload }
        });
        res(e.target.result);
      };
    });
  };

  // addEvent adds a single event to the database.
  const addEvent = async event =>
    await new Promise((res, rej) => {
      const req = eventsDB
        .transaction(eventsTable, "readwrite")
        .objectStore(eventsTable)
        .add(event);

      req.onsuccess = e => {
        publish({ addEvent: { event: event } });
        updateTracerOverallSeverity(event.TracerPayload);
        res(e.target.result);
      };
      req.onerror = e => {
        rej(e);
      };
    });

  const updateTracerOverallSeverity = async tracerPayload => {
    const events = getTracerEventsByPayload(tracerPayload);
    const tracer = getTracerByPayload(tracerPayload);
    const highestSev = (await events)
      .sort((a, b) => a.Severity - b.Severity)
      .pop().Severity;
    const up = await tracer;
    up.OverallSeverity = highestSev;

    return new Promise((res, rej) => {
      const req = tracersDB
        .transaction(tracersTable, "readwrite")
        .objectStore(tracersTable)
        .put(up);

      req.onerror = e => rej(e);
      req.onsuccess = e => {
        publish({
          updateTracerOverallSeverity: { tracer: up }
        });
        res(e.target.result);
      };
    });
  };

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
          // We want to use the key path to dedupe the events. The RawEvent and
          // TracerPayload should be unique across all the data.
          { keyPath: ["RawEvent", join] },
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
    getTracersDelayed: getTracersDelayed,
    getTracerByPayload: getTracerByPayload,
    getTracerEventsByPayload: getTracerEventsByPayload,
    addTracer: addTracer,
    addRequestToTracer: addRequestToTracer,
    addEvent: addEvent
  };
})();
