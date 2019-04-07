(() => {
  fetch = new Proxy(fetch, {
    apply: (t, thisa, al) => {
      // Fetch always needs a first argument, which is the URL. Look for query parameters
      // to replace.
      const argsp = new Promise(r => {
        const u = replace.str(al[0]);
        if (u.tracers.length !== 0) al[0] = u.str;
        if (al.length >= 2) {
          // If the fetch has options, replace the header values, key, and body arguments.
          // Bodies can come in many forms, so we need to handle them differently.
          let headers;
          if (al[1].headers) headers = replace.headers(al[1].headers);
          if (al[1].body) {
            replace.body(al[1].body).then(b => {
              // 1. If there were no headers and no tracers in the body, return.
              if (!headers && b.tracers.length === 0) {
                r(al);
              } else if (
                // 2. If there were headers, but no tracers in the headers and no tracers in the body, return.
                headers &&
                headers.tracers.length === 0 &&
                b.tracers.length === 0
              ) {
                r(al);
              } else {
                al[1].body = b.body;
                al[1].headers = headers.headers;

                r(al);
              }
            });
          } else {
            if (headers) al[1].headers = headers.headers;
            r(al);
          }
        } else {
          r(al);
        }
      });

      return argsp.then(args => Reflect.apply(t, thisa, args));
    }
  });
})();
