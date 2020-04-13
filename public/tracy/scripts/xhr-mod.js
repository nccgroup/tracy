(() => {
  // sendToAPI sends the tracers generated from an XHR request to
  // the API for storage.
  const sendToAPI = async (xhr, tracers = []) => {
    if (!xhr.tracers) {
      xhr.tracers = [];
    }
    await Promise.all(
      [...xhr.tracers, ...tracers].map(async (t) => await tracyRPC.addTracer(t))
    );
  };

  XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
    apply: (t, thisa, al) => {
      // Check if a body was supplied. If not or if the body was null, send the
      // collected tracers for this request.
      if (al.length !== 1 || !al[0]) {
        sendToAPI(thisa);
        return Reflect.apply(t, thisa, al);
      }

      const { body, tracers } = replace.body(al[0]);
      sendToAPI(thisa, tracers);

      return tracers.length === 0
        ? Reflect.apply(t, thisa, al)
        : Reflect.apply(t, thisa, [body]);
    },
  });

  XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
    apply: (t, thisa, al) => {
      // Sanity check to make sure there are two elements to index.
      if (al.length < 2) {
        return Reflect.apply(t, thisa, al);
      }

      const { str, tracers } = replace.str(al[1]);
      if (tracers.length === 0) {
        return Reflect.apply(t, thisa, al);
      }

      if (!thisa.tracers) {
        thisa.tracers = [];
      }
      thisa.tracers = [...thisa.tracers, ...tracers];
      al[1] = str;
      return Reflect.apply(t, thisa, al);
    },
  });
  XMLHttpRequest.prototype.setRequestHeader = new Proxy(
    XMLHttpRequest.prototype.setRequestHeader,
    {
      apply: (t, thisa, al) => {
        // Sanity check to make sure there are two elements to index.
        if (al.length !== 2) {
          return Reflect.apply(t, thisa, al);
        }
        const { tracers, headers } = replace.headers([[al[0], al[1]]]);
        if (tracers.length === 0) {
          return Reflect.apply(t, thisa, al);
        }
        if (!thisa.tracers) {
          thisa.tracers = [];
        }
        thisa.tracers = [...thisa.tracers, ...tracers];
        return Reflect.apply(t, thisa, [...headers].pop());
      },
    }
  );
})();
