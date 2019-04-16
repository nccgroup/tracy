const websocket = (() => {
  // TODO: consider getting rid of this websocket so that we can do away with persistent
  // background page. SHOULD BE DOABLE NOW.
  // Connect to the websocket endpoint so we don't have to poll for new tracer strings.
  const websocketConnect = () => {
    if (!settings.isDisabled()) {
      const nws = new WebSocket(`ws://${settings.getServer()}/ws`);

      nws.addEventListener("message", event => {
        let req = JSON.parse(event.data);
        switch (Object.keys(req)[0]) {
          case "Request":
            req.Request.Tracers.map(t => {
              if (
                // When we update a tracer with a new screenshot, that is all it has in there
                // and we don't really care about that here.
                t.TracerPayload !== "" &&
                !settings.getTracerPayloads().includes(t.TracerPayload)
              ) {
                //                settings.getTracerPayloads().push(t.TracerPayload);
              }
            });
            break;
          case "Reproduction":
            /*reproductions.reproduceFinding(
                           req.Reproduction.Tracer,
                           req.Reproduction.TracerEvent,
                           req.Reproduction.DOMContext,
                           req.Reproduction.ReproductionTests
                           );*/
            break;
          case "Notification":
            const n = req.Notification;
            n.Event.DOMContexts.map(c => {
              if (c.Severity >= 2) {
                //reproductions.prepCache(n.Event);
                return true;
              }
              return false;
            });
            break;
          default:
            break;
        }
      });

      // Attempt to reconnect when the socket closes.
      nws.addEventListener("close", () => setTimeout(websocketConnect, 1500));
    }
  };

  return { websocketConnect: websocketConnect };
})();
