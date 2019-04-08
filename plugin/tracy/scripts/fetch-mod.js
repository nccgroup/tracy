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
                r({ al: al, tracers: u.tracers });
              } else if (
                // 2. If there were headers, but no tracers in the headers and no tracers in the body, return.
                headers &&
                headers.tracers.length === 0 &&
                b.tracers.length === 0
              ) {
                r({ al: al, tracers: u.tracers });
              } else {
                al[1].body = b.body;

                let ret = {
                  al: al,
                  tracers: u.tracers.concat(b.tracers)
                };
                if (headers) {
                  ret.al[1].headers = headers.headers;
                  ret.tracers = ret.tracers.concat(headers.tracers);
                }

                r(ret);
              }
            });
          } else {
            if (headers) al[1].headers = headers.headers;
            r({ al: al, tracers: u.tracers.concat(headers.tracers) });
          }
        } else {
          r({ al: al, tracers: u.tracers });
        }
      });

      return argsp.then(args => {
        if (args.tracers.length !== 0) {
          (async () => {
            window.postMessage(
              {
                "message-type": "background-fetch",
                route: "/api/tracy/tracers",
                method: "POST",
                body: JSON.stringify({
                  RawRequest: await buildRequestFromFetch(args.al),
                  RequestURL: document.location.href,
                  RequestMethod:
                    args.al.length > 1 && args.al.method
                      ? args.al.method
                      : "GET",
                  Tracers: args.tracers
                })
              },
              "*"
            );
          })();
        }
        return Reflect.apply(t, thisa, args.al);
      });
    }
  });

  // buildRequestFromFetch builds an HTTP request string that is expected
  // to be produced from the fetch arguments.
  const version = "HTTP/1.1";
  const buildRequestFromFetch = async al => {
    const method = al.length > 1 && al.method ? al.method : "GET";
    const url = al[0].startsWith("http") ? new URL(url).pathname : al[0];
    const host = al[0].startsWith("http")
      ? new URL(url).host
      : document.location.host;
    let headers = "";
    if (al[1].headers) {
      for (let i of al[1].headers) {
        headers += `
${i[0]}: ${i[1]}`;
      }
    }

    // Build a request object from the fetch parameters and use the Body mixins.
    // Much easier than parsing everything individually.
    const req = new Request(al[0], al[1]);
    const bodyBlob = await req.blob();
    const reader = new FileReader();
    const body = await new Promise(r => {
      reader.addEventListener("loadend", e => r(e.srcElement.result));
      reader.readAsText(bodyBlob);
    });
    return `${method} ${url} ${version}
Host: ${host}${headers}
    
${body}`;
  };
})();
