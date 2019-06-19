const jobs = (() => {
  // bulkAddEvents makes a POST request to the bulk events to the API with
  // a set of events from the DOM.
  const bulkAddEvents = async events => {
    if (!settings.isDisabled() && events.length > 0) {
      const { err } = await background.fetch({
        method: "POST",
        route: "/api/tracy/tracers/events/bulk",
        body: JSON.stringify(events)
      });

      if (err)
        setTimeout(function() {
          bulkAddEvents(events);
        }, 1500);
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

  const processDOMEvents = async () => {
    // Send any jobs off to the web worker.
    worker.postMessage({
      jobs: j,
      tracerPayloads: await settings.getTracerPayloads(0)
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
  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name !== "processDOMEvents") return;
    processDOMEvents();
  });
  return { add: add };
})();
