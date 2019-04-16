const background = (() => {
  // cross-orgin fetches are disallowed from content scripts in Chrome Extensions,
  // so doing our fetch()'s from background instead of content scripts:
  // https://www.chromium.org/Home/chromium-security/extension-content-script-fetches
  // "message" should have a route, method, and optionally a body
  const backgroundFetch = async (message, sender, callback) => {
    let opts = {
      method: message.method,
      headers: { Hoot: "!", "X-TRACY": "NOTOUCHY" },
      body: !message.body ? "" : message.body
    };

    const lc = message.method.toLowerCase();
    if (lc === "get" || lc === "header") delete opts.body;
    const req = new Request(
      `http://${settings.getServer()}${message["route"]}`,
      opts
    );
    const resp = await fetch(req);
    const json = await resp.json();

    // If the background fetch is to create a new tracer,
    // update our list of tracer payloads.
    if (message["route"] === "/api/tracy/tracers" && lc === "post") {
      settings.setTracerPayloads(
        settings
          .getTracerPayloads()
          .concat(JSON.parse(message.body).Tracers.map(t => t.TracerPayload))
      );
    }

    callback(json);
  };

  return { fetch: backgroundFetch };
})();
