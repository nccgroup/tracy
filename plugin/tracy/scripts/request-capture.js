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

        // These are only handling link clicks, so there shouldn't be any body
        /*        async () => {
                   const { err } = await background.fetch(
                   {
                   route: "/api/tracy/tracers",
                   method: "POST",
                   body: JSON.stringify({
                   RawRequest: `${r.method} ${url.pathname}${url.search}  HTTP/1.1
                   Host: ${url.host}`,
                   RequestURL: newURL,
                   RequestMethod: r.method,
                   Tracers: tracers
                   })
                   },
                   null,
                   () => {}
                   );
                   if (err) console.error(err);
                   };*/

        // I would like to know when this is happening.
        console.error("[REDIRECTING]", r.url, newURL);
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
      // Don't worry about requests to the API.
      const url = new URL(r.url);
      if (url.pathname.startsWith("/api/tracy/")) return;
      const payloads = await settings.getTracerPayloads(2000);
      // Grab the object created by the onBeforeRequest event handler for this request.
      // It should always be there.
      const p = requests[r.requestId];
      if (!p) {
        console.error(
          "[SHOULDN'T HAPPEN] no request with requestId",
          r,
          requests
        );
        return;
      }

      (async () => {
        const headers = r.requestHeaders.reduce(
          (accum, h) => `${accum}
${h.name}: ${h.value}`,
          ""
        );

        // Resolve the promise to get the data from the previous event handler.
        let { body, tracers } = p;

        // Search through the headers for tracers.
        tracers = [
          ...new Set(
            payloads
              .map(payload =>
                r.requestHeaders
                  .map(h => {
                    const nid = h.name.indexOf(payload);
                    const vid = h.value.indexOf(payload);

                    if (nid !== -1 || vid !== -1) {
                      return payload;
                    }
                  })
                  .filter(t => t)
              )
              .flat()
              .concat(tracers)
          )
        ];

        const rr = `${r.method} ${url.pathname}${url.search}  HTTP/1.1${headers}
                      
${body}`;

        tracers.map(async t => {
          // Add a request for each of the tracers found in it.
          const { err } = await background.fetch(
            {
              route: `/api/tracy/tracers/${t}/request`,
              method: "POST",
              body: JSON.stringify({
                RawRequest: rr,
                RequestURL: url.toString(),
                RequestMethod: r.method
              })
            },
            null,
            () => {}
          );
          if (err) console.error(err);
        });
      })();
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders"]
  );

  // Event handler used to capture all request bodies so that we can search
  // them for tracers we have seen before. Since headers are parsed in a
  // different event handler, this data is stored in a promise which is grabbed
  // by the next event handler. This is a non-blocking event handler, so it
  // doesn't matter that we do this for every request.
  chrome.webRequest.onBeforeRequest.addListener(
    async r => {
      const url = new URL(r.url);
      let tracers = [];

      // Don't worry about requests to the API.
      if (url.pathname.startsWith("/api/tracy/")) return;

      const payloads = await settings.getTracerPayloads(2000);
      const tracersn = payloads.reduce((accum, curr) => {
        // Search through all the query parameters for tracers.
        if (r.url.indexOf(curr) !== -1) {
          accum.push(curr);
        }

        // Search through the request body for tracers.
        if (r.requestBody) {
          bid = r.requestBody.indexOf(curr);
          if (bid !== -1) {
            accum.push(curr);
          }
        }
        return accum;
      }, tracers);
      console.log("before request", r);
      requests[r.requestId] = { body: r.requestBody || "", tracers: tracersn };
      console.log("state", r.requestId, requests);
    },
    { urls: ["<all_urls>"] },
    ["requestBody"]
  );

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
