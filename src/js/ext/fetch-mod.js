export const fetchModInit = (replace, rpc) => {
  fetch = new Proxy(fetch, {
    apply: async (t, thisa, al) => {
      await Promise.all(
        replaceFetchArguments(al).map(async (t) => await rpc.addTracer(t))
      );
      return Reflect.apply(t, thisa, al);
    },
  });
  const replaceFetchURL = (al) => {
    const { tracers, str } = r.str(al[0]);
    al[0] = str;
    return tracers;
  };
  const replaceFetchHeaders = (al) => {
    if (al[1].headers) {
      const { headers, tracers } = r.headers(al[1].headers);
      al[1].headers = headers;
      return tracers;
    }

    return [];
  };
  const replaceFetchBody = (al) => {
    if (al[1].body) {
      const { body, tracers } = r.body(al[1].body);
      al[1].body = body;
      return tracers;
    }
    return [];
  };
  const replaceFetchOptions = (al) => {
    if (al.length >= 2) {
      return [...replaceFetchHeaders(al), ...replaceFetchBody(al)];
    }
    return [];
  };
  const replaceFetchArguments = (al) => [
    ...replaceFetchURL(al),
    ...replaceFetchOptions(al),
  ];
};
