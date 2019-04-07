(() => {
  XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
    apply: (t, thisa, al) => {
      if (al.length !== 1) return Reflect.apply(t, thisa, al);
      replace.body(al[0]).then(r => {
        r.tracers.length === 0
          ? Reflect.apply(t, thisa, al)
          : Reflect.apply(t, thisa, [r.body]);

        if (r.tracers.length !== 0) {
          window.postMessage(
            {
              "message-type": "background-fetch",
              route: "/api/tracy/tracers",
              method: "POST",
              body: JSON.stringify({
                RawRequest: "", //buildRequestFromForm(evt.target),
                RequestURL: document.location.href,
                RequestMethod: "", //evt.target.getAttribute("method"),
                Tracers: r.tracers
              })
            },
            "*"
          );
        }
      });
    }
  });

  XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
    apply: (t, thisa, al) => {
      if (al.length < 2) return Reflect.apply(t, thisa, al);
      const b = replace.str(al[1]);
      if (b.tracers.length === 0) return Reflect.apply(t, thisa, al);
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

        return Reflect.apply(t, thisa, [key.str, value.str]);
      }
    }
  );
})();
