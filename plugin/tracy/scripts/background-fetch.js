const background = (() => {
  // fetchNoCallback just makes a fetch with all the default options
  // to the API.
  const fetchNoCallback = async o => {
    const apiKey = await new Promise(r =>
      chrome.storage.local.get({ apiKey: "" }, resp => r(resp.apiKey))
    );
    let opts = {
      method: o.method,
      headers: { Hoot: apiKey },
      body: !o.body ? "" : o.body
    };

    const lc = o.method.toLowerCase();
    if (lc === "get" || lc === "header") delete opts.body;
    const req = new Request(`http://${settings.getServer()}${o.route}`, opts);
    const resp = await fetch(req);
    return await resp.json();
  };

  // cross-orgin fetches are disallowed from content scripts in Chrome Extensions,
  // so doing our fetch()'s from background instead of content scripts:
  // https://www.chromium.org/Home/chromium-security/extension-content-script-fetches
  // "message" should have a route, method, and optionally a body
  const fetchWithCallback = async (message, sender, callback) => {
    const json = await fetch(message);
    // If the background fetch is to create a new tracer,
    // update our list of tracer payloads.
    if (
      message.route === "/api/tracy/tracers" &&
      message.method.toLowerCase() === "post"
    ) {
      settings.setTracerPayloads(
        settings
          .getTracerPayloads()
          .concat(JSON.parse(message.body).Tracers.map(t => t.TracerPayload))
      );
    }

    callback(json);
  };

  return { fetchWithCallback: fetchWithCallback, fetch: fetchNoCallback };
})();
