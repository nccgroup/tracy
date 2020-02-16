(() => {
  // Routes messages from the extension to various functions on the background.
  const messageRouter = (message, sender, sendResponse) => {
    if (message["message-type"]) {
      switch (message["message-type"]) {
        case "job":
          jobs.add(message, sender, sendResponse);
          break;
        case "config":
          settings.query(message, sender, sendResponse);
          break;
        case "screenshot":
          screenshot.take(message, sender, sendResponse);
          return true;
        case "database":
          let dbprom;
          switch (message["query"]) {
            case "getTracers":
              dbprom = database.getTracers();
              break;
            case "getTracerByPayload":
              dbprom = database.getTracersByPayload(message["tracerPayload"]);
              break;
            case "getTracerEventsByPayload":
              dbprom = database.getTracerEventsByPayload(
                message["tracerPayload"]
              );
              break;
            case "addTracer":
              dbprom = database.addTracer(message["tracer"]);
              break;
            case "addRequestToTracer":
              dbprom = database.addRequestToTracer(
                message["request"],
                message["tracerPayload"]
              );
              break;
            case "addEvent":
              dbprom = database.addEvent(message["event"]);
              break;
            default:
              console.log("[BAD MESSAGE QUERY]", message["query"]);
              dbprom = new Promise(r => r("BAD"));
              break;
          }
          dbprom
            .then(t => {
              try {
                sendResponse(t);
              } catch (e) {
                console.error(
                  "failed to send a response to a database request",
                  message,
                  t,
                  e
                );
                // Send an empty response to make sure the UI doesn't get stuck.
                sendResponse([]);
              }
            })
            .catch(e => console.log("[DB ERROR]", e));
          return true;
      }
    }
  };

  chrome.runtime.onMessage.addListener(messageRouter);
})();
