(() => {
  fetch = new Proxy(fetch, {
    apply: (t, thisa, al) => {
      // Fetch always needs a first argument, which is the URL. Look for query parameters
      // to replace.
      const argsp = (async () => {
        const u = replace.str(al[0]);
        if (u.tracers.length !== 0) al[0] = u.str;
        if (al.length >= 2) {
          // If the fetch has options, replace the header values and key, and body arguments.
          // Bodies can come in many forms, so we need to handle them differently.
          let headers;
          if (al[1].headers) headers = replace.headers(al[1].headers);
          if (al[1].body) {
            const b = replace.body(al[1].body);
            // 1. If there were no headers and no tracers in the body, return.
            if (!headers && b.tracers.length === 0) {
              return { al: al, tracers: u.tracers };
            } else if (
              // 2. If there were headers, but no tracers in the headers and no tracers in the body, return.
              headers &&
              headers.tracers.length === 0 &&
              b.tracers.length === 0
            ) {
              return { al: al, tracers: u.tracers };
            } else {
              let ret = {
                al: al,
                tracers: u.tracers
              };
              // At least headers or body is there. Add them back to the request.
              if (b.tracers.length !== 0) {
                ret.al[1].body = b.body;
                ret.tracers = ret.tracers.concat(b.tracers);
              }
              if (headers) {
                ret.al[1].headers = headers.headers;
                ret.tracers = ret.tracers.concat(headers.tracers);
              }

              return ret;
            }
          } else {
            if (headers) {
              al[1].headers = headers.headers;
              return { al: al, tracers: u.tracers.concat(headers.tracers) };
            } else {
              return { al: al, tracers: u.tracers };
            }
          }
        } else {
          return { al: al, tracers: u.tracers };
        }
      })();
      return argsp
        .then(args => {
          (async () => {
            args.tracers.map(t => {
              // When creating a tracer, make sure the Requests and OverallSeverity
              // attributes are there.
              t.Requests = [];
              t.Severity = 0;
              t.HasTracerEvents = false;

              const event = new CustomEvent("tracyMessage", {
                detail: {
                  "message-type": "database",
                  query: "addTracer",
                  tracer: t
                }
              });
              window.dispatchEvent(event);
            });
          })();
          return Reflect.apply(t, thisa, args.al);
        })
        .catch(e => {
          console.error("[FETCH-MOD]: ", e);
        });
    }
  });
})();
