(() => {
  XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
    apply: (t, thisa, al) => {
      if (al.length !== 1) return Reflect.apply(t, thisa, al);
      replace.body(al[0]).then(r => {
        r.tracers.length === 0
          ? Reflect.apply(t, thisa, al)
          : Reflect.apply(t, thisa, [r.body]);

        if (!thisa.tracers) thisa.tracers = [];
        if (r.tracers.length !== 0) {
          (async () => {
            window.postMessage(
              {
                "message-type": "background-fetch",
                route: "/api/tracy/tracers",
                method: "POST",
                body: JSON.stringify({
                  RawRequest: await buildRequestFromXHR(thisa, r.body),
                  RequestURL: document.location.href,
                  RequestMethod: thisa.method,
                  Tracers: thisa.tracers.concat(r.tracers)
                })
              },
              "*"
            );
          })();
        }
      });
    }
  });

  XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
    apply: (t, thisa, al) => {
      if (al.length < 2) return Reflect.apply(t, thisa, al);
      thisa.method = al[0];
      thisa.url = al[1];
      const b = replace.str(al[1]);
      if (b.tracers.length === 0) return Reflect.apply(t, thisa, al);
      if (!thisa.tracers) thisa.tracers = [];
      thisa.tracers = thisa.tracers.concat(b.tracers);

      al[1] = b.str;
      return Reflect.apply(t, thisa, al);
    }
  });

  XMLHttpRequest.prototype.setRequestHeader = new Proxy(
    XMLHttpRequest.prototype.setRequestHeader,
    {
      apply: (t, thisa, al) => {
        if (al.length !== 2) return Reflect.apply(t, thisa, al);
        const key = replace.str(al[0]);
        const value = replace.str(al[1]);
        const tracers = key.tracers.concat(value.tracers);
        if (tracers.length === 0) return Reflect.apply(t, thisa, al);
        if (!thisa.tracers) thisa.tracers = [];
        thisa.tracers = thisa.tracers.concat(tracers);
        if (!thisa.headers) thisa.headers = "";
        thisa.headers = `${thisa.headers}
${key.str}: ${value.str}`;
        return Reflect.apply(t, thisa, [key.str, value.str]);
      }
    }
  );

  const version = "HTTP/1.1";
  const buildRequestFromXHR = async (xhr, body) => {
    const url = xhr.url.startsWith("http")
      ? new URL(xhr.url).pathname
      : xhr.url;
    const host = xhr.url.startsWith("http")
      ? new URL(xhr.url).host
      : document.location.host;

    // Build a request object from the fetch parameters and use the Body mixins.
    // Much easier than parsing everything individually.
    const lc = xhr.method.toLowerCase();
    let opts;
    if (lc === "get" || lc === "header") {
      opts = { method: xhr.method };
    } else {
      opts = { method: xhr.method, body: body };
    }
    const req = new Request(url, opts);
    const b = await req.text();
    return `${xhr.method} ${url} ${version}
Host: ${host}${xhr.headers}

${b}`;
  };
})();
