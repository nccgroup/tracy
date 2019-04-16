const jobs = (() => {
  // bulkAddEvents makes a POST request to the bulk events to the API with
  // a set of events from the DOM.
  const bulkAddEvents = events => {
    if (!settings.isDisabled() && events.length > 0) {
      fetch(`http://${settings.getServer()}/api/tracy/tracers/events/bulk`, {
        headers: {
          Hoot: "!",
          "Content-Type": "application/json; charset=UTF-8"
        },
        method: "POST",
        body: JSON.stringify(events)
      }).catch(err =>
        setTimeout(function() {
          bulkAddEvents(events);
        }, 1500)
      );
    }
  };

  // Add a job to the job queue.
  const add = async (message, sender, sendResponse) => {
    // Don't add a job if it's one of the tabs that we have collected
    // in our reproduction steps flow.
    /*  if (reproductions.tabs.get()[sender.tab.id]) {
           return;
           }*/

    if (!settings.isDisabled()) {
      // If it is the first job added, set a timer to process the jobs.
      if (j.length === 0) {
        chrome.alarms.create("processDOMEvents", { when: Date.now() + 1500 });
      }
      j.push(message);
    }

    // This is needed for the general way we pass messages to the background.
    // All message handlers need to return something.
    sendResponse(true);
  };

  const processDOMEvents = () => {
    // Send any jobs off to the web worker.
    worker.postMessage({
      jobs: j,
      tracerPayloads: settings.getTracerPayloads()
    });

    // Clear out the jobs.
    j = [];
  };

  // Global list of DOM writes. When a job is written to this array
  // the background page will wait a few seconds collecting more jobs
  // and then send them all off to the API.
  let j = [];
  // Process all the jobs in the current queue.
  const loc = chrome.runtime.getURL("tracy/scripts/worker.js");
  const worker = new Worker(loc);
  // Any that come back get sent out the API server.
  worker.addEventListener("message", e => bulkAddEvents(e.data));
  chrome.alarms.onAlarm.addListener(processDOMEvents);
  return { add: add };
})();
