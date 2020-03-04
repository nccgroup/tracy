(() => {
  const url = new URL(window.location.toString());
  const copy = new URLSearchParams();
  let mod = false;
  let tracers = [];
  const pathReplace = replace.str(url.pathname);
  if (pathReplace.tracers.length > 0) {
    tracers = tracers.concat(pathReplace.tracers);
    mod = true;
  }

  for (const [key, value] of url.searchParams) {
    const keyr = replace.str(key);
    const valuer = replace.str(value);

    if (keyr.tracers.length !== 0 || valuer.tracers.length !== 0) {
      tracers = tracers.concat(keyr.tracers).concat(valuer.tracers);
      mod = true;
    }
    copy.append(keyr.str, valuer.str);
  }
  const newHash = replace.str(url.hash);
  if (newHash.tracers.length !== 0) {
    tracers = tracers.concat(newHash.tracers);
    mod = true;
  }

  if (mod) {
    url.search = copy.toString();
    url.hash = newHash.str;
    url.pathname = pathReplace.str;
    // If any tracers were created, add them to the database.
    tracers.map(t => {
      t.Requests = [];
      t.Severity = 0;
      t.HasTracerEvents = false;
      window.postMessage({
        "message-type": "database",
        query: "addTracer",
        tracer: t
      });
    });

    window.location = url.toString();
  }
})();
