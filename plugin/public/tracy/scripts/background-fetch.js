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
    let resp;
    try {
      resp = await fetch(req);
    } catch (e) {
      return { json: null, err: e };
    }
    if (resp.status === 500) return { json: null, err: resp.statusText };
    return { json: await resp.json(), err: null };
  };

  // cross-orgin fetches are disallowed from content scripts in Chrome Extensions,
  // so doing our fetch()'s from background instead of content scripts:
  // https://www.chromium.org/Home/chromium-security/extension-content-script-fetches
  // "message" should have a route, method, and optionally a body
  const fetchWithCallback = async (message, sender, callback) => {
    const json = await fetchNoCallback(message);

    // If the background fetch is to create a new tracer,
    // update our list of tracer payloads.
    const payloads = await settings.getTracerPayloads(0);
    if (
      message.route === "/api/tracy/tracers" &&
      message.method.toLowerCase() === "post"
    ) {
      settings.setTracerPayloads(
        payloads.concat(
          JSON.parse(message.body).Tracers.map(t => t.TracerPayload)
        )
      );
    }

    // If the background fetch is to create a new tracer,
    // update our list of tracer payloads.
    if (
      message.route === "/api/tracy/tracers/requests" &&
      message.method.toLowerCase() === "post"
    ) {
      settings.setTracerPayloads(
        payloads.concat(JSON.parse(message.body).TracerPayload)
      );
    }

    callback(json);
  };

  return { fetchWithCallback: fetchWithCallback, fetch: fetchNoCallback };
})();
