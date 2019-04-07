(() => {
  fetch = new Proxy(fetch, {
    apply: (t, thisa, al) => {
      // The extension will catch basic requests
      if (al.length === 1) return Reflect.apply(t, thisa, al);
      // If the fetch has options, replace the header values, key, and body arguments.
      // Bodies can come in many forms, so we need to handle them differently.
      const headers = replace.headers(al[1].headers);
      const body = replace.body(al[1].body);

      Promise.all([headers, body]).then(p => {
        const isHeaders = p[0] instanceof Headers;
        al[1].body = isHeaders ? p[1] : p[0];
        al[1].headers = isHeaders ? p[0] : p[1];
        Reflect.apply(t, thisa, al);
      });
    }
  });
})();
