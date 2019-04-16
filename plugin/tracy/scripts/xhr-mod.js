(() => {
  const sendToAPI = async (xhr, body = "", tracers = []) => {
    if (!xhr.tracers) xhr.tracers = [];
    const t = xhr.tracers.concat(tracers);
    if (t.length === 0) {
      return;
    }
    window.postMessage(
      {
        "message-type": "background-fetch",
        route: "/api/tracy/tracers",
        method: "POST",
        body: JSON.stringify({
          RawRequest: await buildRequestFromXHR(xhr, body),
          RequestURL: xhr.url.startsWith("http")
            ? new URL(xhr.url).toString()
            : `${document.location.origin}${xhr.url}`,
          RequestMethod: xhr.method,
          Tracers: t
        })
      },
      "*"
    );
  };

  XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
    apply: (t, thisa, al) => {
      if (al.length !== 1 || !al[0]) {
        sendToAPI(thisa);
        return Reflect.apply(t, thisa, al);
      }

      replace.body(al[0]).then(r => {
        sendToAPI(thisa, r.body, r.tracers);

        return r.tracers.length === 0
          ? Reflect.apply(t, thisa, al)
          : Reflect.apply(t, thisa, [r.body]);
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
      thisa.url = b.str;
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

  const buildRequestFromXHR = async (xhr, body) => {
    const path = xhr.url.startsWith("http")
      ? new URL(xhr.url).pathname
      : xhr.url;
    const host = xhr.url.startsWith("http")
      ? new URL(xhr.url).host
      : document.location.host;
    const search = xhr.url.startsWith("http") ? new URL(xhr.url).search : "";

    // Build a request object from the XHR parameters and use the Body mixins.
    // Much easier than parsing everything individually.
    const lc = xhr.method.toLowerCase();
    let opts;
    if (lc === "get" || lc === "header") {
      opts = { method: xhr.method };
    } else {
      opts = { method: xhr.method, body: body };
    }
    const req = new Request(path, opts);
    const bodyBlob = await req.blob();
    const reader = new FileReader();
    const b = await new Promise(r => {
      reader.addEventListener("loadend", e => r(e.srcElement.result));
      reader.readAsText(bodyBlob);
    });

    return `${xhr.method} ${path}${search} HTTP/1.1
Host: ${host}${xhr.headers || ""}

${b}`;
  };
})();
