(() => {
  const ui = chrome.runtime.getURL("index.html");
  chrome.webRequest.onBeforeRequest.addListener(
    r => {
      const url = new URL(r.url);
      if (url.hostname === "tracy") {
        return { redirectUrl: ui };
      }
      const copy = new URLSearchParams();
      let mod = false;
      let tracers = [];
      url.searchParams.forEach((value, key) => {
        const keyr = replace.str(key);
        const valuer = replace.str(value);

        if (keyr.tracers.length !== 0 || valuer.tracers.length !== 0) {
          tracers = tracers.concat(keyr.tracers).concat(valuer.tracers);
          mod = true;
        }
        copy.append(keyr.str, valuer.str);
      });

      // Not a fan of doing this, but luckily this only happens when you click
      // a link that has a zzPLAINzz or zzXSSzz in it, which I imagine won't be the usual
      // case. We could try to hook link clicks like how we hook onsubmit with forms.
      // This is also used for navigation through document.location, which I am pretty
      // sure is un-hookable. I keep getting the following error:
      // TypeError: can't redefine non-configurable property "location"
      // Looks like this also happens for img requests and the like (pixel trackers and other
      // things that make outbound requests)
      if (mod) {
        url.search = copy.toString();
        const newURL = url.toString();

        // If any tracers were created, add them to the database.
        tracers.map(t => {
          t.Requests = [];
          t.OverallSeverity = 0;
          t.HasTracerEvents = false;
          database.addTracer(t);
        });

        // I would like to know when this is happening.
        console.log("[REDIRECTING]", r.url, newURL);
        return { redirectUrl: newURL };
      }
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
  );

  // requests holds an object of objects. Each entry corresponds
  // to a request identified by its requestId. This is done to
  // use two different event handlers to collect all the headers and
  // all the query parameters and post body arguments.
  const requests = {};

  // Event handler to parse all the request headers and look for tracers.
  // This event handler always/ happens after onBeforeRequest so there should be
  // a set of data that corresponds to this request stored in *requests*  that
  // was already parsed by that event handler that looks for tracers in the query
  // parameters and body.
  chrome.webRequest.onBeforeSendHeaders.addListener(
    async r => {
      if (new URL(r.url).protocol.startsWith("data")) return;
      let t = [];
      try {
        // Need to wait a period of time so we get all the tracers after
        // they have been collected from the various handlers. This includes
        // the request capture function above and all the *-mod javascript files.
        // If informal testing, without a delay, we'd miss some tracers due to timing
        // issues.
        t = await database.getTracersDelayed(2000);
      } catch (e) {
        console.error(e);
        return;
      }

      const payloads = t.map(t => t.TracerPayload);
      // Grab the object created by the onBeforeRequest event handler for this request.
      // It should always be there.
      let p = requests[`${r.requestId}:${r.url}`];
      if (!p) {
        p = await new Promise(res => {
          requests[`${r.requestId}:${r.url}`] = res;
        });
      }

      const headers = r.requestHeaders.reduce(
        (accum, h) => `${accum}
${h.name}: ${h.value}`,
        ""
      );

      // Get the data from the previous event handler.
      let { body, tracers } = p;
      // Search through the headers for tracers.
      const allTracers = [
        ...new Set(
          payloads
            .map(p =>
              r.requestHeaders
                .map(h => {
                  const nid = h.name.indexOf(p);
                  const vid = h.value.indexOf(p);

                  if (nid !== -1 || vid !== -1) {
                    return p;
                  }
                })
                .filter(Boolean)
            )
            .flat()
            .concat(tracers)
        )
      ];

      const url = new URL(r.url);
      const rr = `${r.method} ${url.pathname}${url.search}  HTTP/1.1${headers}
                      
${body}`;

      // Add a request for each of the tracers found in it.
      allTracers.map(t =>
        add(t, {
          RawRequest: rr.trim(),
          RequestURL: url.toString(),
          RequestMethod: r.method
        })
      );
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders"]
  );

  const createJobQueue = () => {
    let jobs = {};
    const saveAllRequests = async () => {
      // Clone the jobs right away.
      const work = { ...jobs };
      // Reset our jobs.
      jobs = {};

      for (tracer in work) {
        database.addRequestsToTracer(work[tracer], tracer);
      }
    };
    chrome.alarms.onAlarm.addListener(alarm => {
      if (alarm.name !== "saveAllRequests") return;
      saveAllRequests();
    });
    return async (tracer, job) => {
      if (Object.keys(jobs).length === 0) {
        chrome.alarms.create("saveAllRequests", {
          when: Date.now() + 1500
        });
      }
      // Add a job.
      if (jobs[tracer]) {
        jobs[tracer] = [...jobs[tracer], job];
      } else {
        jobs[tracer] = [job];
      }
    };
  };
  const add = createJobQueue();

  // Event handler used to capture all request bodies so that we can search
  // them for tracers we have seen before. Since headers are parsed in a
  // different event handler, this data is stored in a promise which is grabbed
  // by the next event handler. This is a non-blocking event handler, so it
  // doesn't matter that we do this for every request.
  chrome.webRequest.onBeforeRequest.addListener(
    async r => {
      if (new URL(r.url).protocol.startsWith("data")) return;
      let tracers = [];
      try {
        // Need to wait a period of time so we get all the tracers after
        // they have been collected from the various handlers. This includes
        // the request capture function above and all the *-mod javascript files.
        // If informal testing, without a delay, we'd miss some tracers due to timing
        // issues.
        tracers = await database.getTracersDelayed(2000);
      } catch (e) {
        console.error(e);
        return;
      }
      const payloads = tracers.map(t => t.TracerPayload);

      const tracersn = payloads
        .map(p => {
          // Search through all the query parameters for tracers.
          if (r.url.indexOf(p) !== -1) {
            return p;
          }

          // If there weren't payloads in the query parameters, search
          // through the request body for tracers. This object either has
          // an error, formData, or raw data.
          if (r.requestBody) {
            return Object.keys(r.requestBody)
              .map(k => {
                switch (k) {
                  case "error":
                    return [];
                  case "formData":
                    const search = (accum, cur) => {
                      if (cur.indexOf(p) !== -1) return [...accum, p];
                      return accum;
                    };
                    const form = r.requestBody.formData;
                    return [
                      ...Object.keys(form).reduce(search, []),
                      ...Object.values(form)
                        .flat()
                        .reduce(search, [])
                    ];
                  case "raw":
                    // JSON blobs come this way.
                    const body = String.fromCharCode
                      .apply(null, new Uint8Array(r.requestBody.raw[0]))
                      .toLowerCase();
                    if (body.indexOf(p) !== -1) {
                      return [p];
                    }
                    return [];
                  default:
                    return [];
                }
              })
              .flat();
          }
        })
        .filter(Boolean);
      const p = requests[`${r.requestId}:${r.url}`];
      const data = { body: formatBody(r.requestBody) || "", tracers: tracersn };

      // If a promise function already exists there, that means the other
      // callback executed first and is waiting for this one to finish.
      // Resolve it's promise function with the data.
      if (p) {
        p(data);
      } else {
        // If nothing was there, add the data.
        requests[`${r.requestId}:${r.url}`] = data;
      }
    },
    { urls: ["<all_urls>"] },
    ["requestBody"]
  );

  const formatBody = body => {
    if (!body) return "";
    return Object.keys(body)
      .map(k => {
        switch (k) {
          case "error":
            return "";
          case "formData":
            const form = body.formData;
            let formStr = "";
            for (i in form) {
              formStr = `${formStr}${i}=${form[i]}&`;
            }
            return formStr.substring(0, formStr.length - 1);
          case "raw":
            // I think this is similar to the Blob situation. Let's just
            // log this and not look for tracers since the data is
            // going to be in a binary format.
            return String.fromCharCode.apply(
              null,
              new Uint16Array(r.requestBody.raw.pop())
            );
          default:
            console.log("new key in request body", r.requestBody);
            return "";
        }
      })
      .pop();
  };

  const removeAfter = async (id, time = 10000) => {
    await new Promise(resolve => setTimeout(resolve, time));
    delete requests[id];
  };

  // The following event handlers remove the request context data from the
  // *requests* object when the request is finished, errors out, or is
  // redirected.
  chrome.webRequest.onBeforeRedirect.addListener(
    r => removeAfter(r.requestId),
    { urls: ["<all_urls>"] }
  );
  chrome.webRequest.onCompleted.addListener(r => removeAfter(r.requestId), {
    urls: ["<all_urls>"]
  });
  chrome.webRequest.onErrorOccurred.addListener(r => removeAfter(r.requestId), {
    urls: ["<all_urls>"]
  });
})();
