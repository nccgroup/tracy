(() => {
  fetch = new Proxy(fetch, {
    apply: (t, thisa, al) => {
      // Fetch always needs a first argument, which is the URL. Look for query parameters
      // to replace.
      const argsp = new Promise(r => {
        const u = replace.str(al[0]);
        if (u.tracers.length !== 0) al[0] = u.str;
        if (al.length >= 2) {
          // If the fetch has options, replace the header values and key, and body arguments.
          // Bodies can come in many forms, so we need to handle them differently.
          let headers;
          if (al[1].headers) headers = replace.headers(al[1].headers);
          if (al[1].body) {
            replace.body(al[1].body).then(b => {
              // 1. If there were no headers and no tracers in the body, return.
              if (!headers && b.tracers.length === 0) {
                r({ al: al, tracers: u.tracers });
              } else if (
                // 2. If there were headers, but no tracers in the headers and no tracers in the body, return.
                headers &&
                headers.tracers.length === 0 &&
                b.tracers.length === 0
              ) {
                r({ al: al, tracers: u.tracers });
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

                r(ret);
              }
            });
          } else {
            if (headers) {
              al[1].headers = headers.headers;
              r({ al: al, tracers: u.tracers.concat(headers.tracers) });
            } else {
              r({ al: al, tracers: u.tracers });
            }
          }
        } else {
          r({ al: al, tracers: u.tracers });
        }
      });

      return argsp
        .then(args => {
          (async () => {
            args.tracers.map(t => {
              // When creating a tracer, make sure the Requests and OverallSeverity
              // attributes are there.
              t.Requests = [];
              t.OverallSeverity = 0;
              t.HasTracerEvents = false;
              window.postMessage(
                {
                  "message-type": "database",
                  query: "addTracer",
                  tracer: t
                },
                "*"
              );
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
