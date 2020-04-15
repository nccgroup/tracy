export const locationModInit = async (replace, rpc) => {
  const url = new URL(window.location.toString());

  const { tracers: utracers, str: pathname } = replace.str(url.pathname);
  const { tracers: stracers, body: searchParams } = replace.body(
    url.searchParams
  );
  const { tracers: htracers, str: hash } = replace.str(url.hash);

  const tracers = [...utracers, ...stracers, ...htracers];
  if (tracers.length === 0) {
    return;
  }

  url.search = searchParams.toString();
  url.hash = hash;
  url.pathname = pathname;

  await Promise.all(tracers.map(async (t) => await rpc.addTracer(t)));
  window.location = url.toString();
};
