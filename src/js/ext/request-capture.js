import { getTracers, addRequestsToTracer } from "./database";
export const requestCaptureInit = () => {
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
    async (r) => {
      if (new URL(r.url).protocol.startsWith("data")) return;
      let t = [];
      try {
        t = await getTracers();
      } catch (e) {
        console.error(e);
        return;
      }

      const payloads = t.map((t) => t.TracerPayload);
      // Grab the object created by the onBeforeRequest event handler for this request.
      // It should always be there.
      let p = requests[`${r.requestId}:${r.url}`];
      if (!p) {
        p = await new Promise((res) => {
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
            .map((p) =>
              r.requestHeaders
                .map((h) => {
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
        ),
      ];

      const url = new URL(r.url);
      const rr = `${r.method} ${url.pathname}${url.search}${url.hash}  HTTP/1.1${headers}
                      
${body}`;

      // Add a request for each of the tracers found in it.
      allTracers.map((t) =>
        add(t, {
          RawRequest: rr.trim(),
          RequestURL: url.toString(),
          RequestMethod: r.method,
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

      for (let tracer in work) {
        addRequestsToTracer(work[tracer], tracer);
      }
    };
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name !== "saveAllRequests") return;
      saveAllRequests();
    });
    return async (tracer, job) => {
      if (Object.keys(jobs).length === 0) {
        chrome.alarms.create("saveAllRequests", {
          when: Date.now() + 1500,
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
    async (r) => {
      const url = new URL(r.url);
      if (
        url.protocol.startsWith("data") ||
        url.protocol.startsWith("chrome") ||
        url.protocol.startsWith("moz")
      ) {
        return;
      }

      const tracers = await getTracers();
      const payloads = tracers.map((t) => t.TracerPayload);

      const tracersn = payloads
        .map((p) => {
          // Search through all the query parameters for tracers.
          if (r.url.indexOf(p) !== -1) {
            return p;
          }

          // If there weren't payloads in the query parameters, search
          // through the request body for tracers. This object either has
          // an error, formData, or raw data.
          if (r.requestBody) {
            const bodySearch = Object.keys(r.requestBody)
              .map((k) => {
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
                      ...Object.values(form).flat().reduce(search, []),
                    ];
                  case "raw":
                    // JSON blobs come this way.
                    if (r.requestBody.raw.length === 0) {
                      return [];
                    }
                    const body = String.fromCharCode
                      .apply(null, new Uint8Array(r.requestBody.raw[0].bytes))
                      .toLowerCase();
                    if (body.indexOf(p) !== -1) {
                      return [p];
                    }
                    return [];
                  default:
                    return [];
                }
              })
              .flat()
              .filter((t) => t.length > 0);

            if (bodySearch.length > 0) {
              return p;
            }
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

  const formatBody = (body) => {
    if (!body) return "";
    return Object.keys(body).map((k) => {
      switch (k) {
        case "error":
          return "";
        case "formData":
          const form = body.formData;
          let formStr = "";
          for (let i in form) {
            formStr = `${formStr}${i}=${form[i]}&`;
          }
          return formStr.substring(0, formStr.length - 1);
        case "raw":
          if (body.raw.length === 0) {
            return "";
          }
          // I think this is similar to the Blob situation. Let's just
          // log this and not look for tracers since the data is
          // going to be in a binary format.
          return String.fromCharCode.apply(
            null,
            new Uint8Array(body.raw[0].bytes)
          );
        default:
          return "";
      }
    })[0];
  };

  const removeAfter = async (id, time = 10000) => {
    await new Promise((resolve) => setTimeout(resolve, time));
    delete requests[id];
  };

  // The following event handlers remove the request context data from the
  // *requests* object when the request is finished, errors out, or is
  // redirected.
  chrome.webRequest.onBeforeRedirect.addListener(
    (r) => removeAfter(r.requestId),
    { urls: ["<all_urls>"] }
  );
  chrome.webRequest.onCompleted.addListener((r) => removeAfter(r.requestId), {
    urls: ["<all_urls>"],
  });
  chrome.webRequest.onErrorOccurred.addListener(
    (r) => removeAfter(r.requestId),
    {
      urls: ["<all_urls>"],
    }
  );
};
