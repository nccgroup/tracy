const jobs = (() => {
  // Add a job to the job queue.
  const add = async (message, sender, sendResponse) => {
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
    const tracers = await database.getTracers();
    worker.postMessage({
      type: "search",
      jobs: j,
      tracerPayloads: tracers.map(t => t.TracerPayload)
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

  const nodeType = {
    1: "ELEMENT_NODE",
    2: "ATTRIBUTE_NODE",
    3: "TEXT_NODE",
    4: "CDATA_SECTION_NODE",
    5: "ENTITY_REFERENCE_NODE",
    6: "ENTITY_NODE",
    7: "PROCESSING_INSTRUCTION_NODE",
    8: "COMMENT_NODE",
    9: "DOCUMENT_NODE",
    10: "DOCUMENT_TYPE_NODE",
    11: "DOCUMENT_FRAGMENT_NODE",
    12: "NOTATION_NODE"
  };
  const dp = new DOMParser();
  worker.addEventListener("message", async e => {
    let tracers;
    try {
      tracers = await database.getTracers();
    } catch (e) {
      console.error(e);
      return;
    }

    // Get all the tracer payloads for the current project.
    const tps = tracers.map(t => t.TracerPayload);
    //TODO: may want to move these loops into a web worker
    const eventsp = await Promise.all(
      tps.map(
        async tp =>
          await Promise.all(
            e.data.map(async event => {
              const dom = dp.parseFromString(event.RawEvent.Data, "text/html");
              const tw = document.createTreeWalker(dom, NodeFilter.SHOW_ALL);

              // Search through the DOM event for instances of the tracer payload.
              // If one is found, assign it a severity rating and collect data about
              // its surrounding.
              let cur, type;
              const domContexts = [];
              while (tw.nextNode()) {
                cur = tw.currentNode;
                type = nodeType[cur.nodeType];

                // Check for text nodes
                if (type === "TEXT_NODE") {
                  if (cur.data.indexOf(tp) !== -1) {
                    domContexts.push({
                      HTMLNodeType: cur.parentNode.nodeName,
                      HTMLLocationType: "TEXT",
                      EventContext: event.RawEvent.Data,
                      Severity: 0,
                      Reason: "LEAF"
                    });
                  }
                  // Text nodes don't have attributes or any of the other things
                  // that we'd want to check. Continue you on.
                  continue;
                }

                // SVG nodes don't have an innerText method
                if (
                  cur.nodeName.toLowerCase() === "svg" ||
                  cur.viewportElement
                ) {
                  if (cur.innerHTML.indexOf(tp) !== -1) {
                    // Lead node of an SVG
                    domContexts.push({
                      HTMLNodeType: cur.parentNode.nodeName,
                      HTMLLocationType: "TEXT",
                      EventContext: event.RawEvent.Data,
                      Severity: 1,
                      Reason: "LEAF NODE SVG TAG"
                    });
                  }
                } else {
                  // Check for leaf nodes.
                  if (cur.innerText.indexOf(tp) !== -1) {
                    // Lead node of a script tage
                    if (cur.parentNode.nodeName.toLowerCase() === "script") {
                      domContexts.push({
                        HTMLNodeType: cur.parentNode.nodeName,
                        HTMLLocationType: "TEXT",
                        EventContext: event.RawEvent.Data,
                        Severity: 1,
                        Reason: "LEAF NODE SCRIPT TAG"
                      });
                    }
                  }
                }

                // Checking the node names
                if (cur.nodeName.indexOf(tp) !== -1) {
                  sev = 3;
                  reason = "TAG NAME";

                  domContexts.push({
                    HTMLNodeType: cur.parentNode.nodeName,
                    HTMLLocationType: "NODE NAME",
                    EventContext: event.RawEvent.Data,
                    Severity: 3,
                    Reason: "NODE NAME"
                  });
                }

                // Checking the attributes
                [...cur.attributes].map(a => {
                  // the attribute name contains a tracer
                  if (a.nodeName.indexOf(tp) !== -1) {
                    domContexts.push({
                      HTMLNodeType: cur.parentNode.nodeName,
                      HTMLLocationType: "ATTRIBUTE NAME",
                      EventContext: event.RawEvent.Data,
                      Severity: 3,
                      Reason: "ATTRIBUTE NAME"
                    });
                  }

                  // the attribute value contains a tracer
                  const i = a.value.indexOf(tp);
                  if (i !== -1) {
                    let sev = 1;
                    let reason = "ATTRIBUTE VALUE";
                    // We only want this event to fire when the user-controlled begins the value
                    // of the href, otherwise we probably won't be able to get the javascript
                    // protocol in there.
                    if (a.nodeName === "href" && i === 0) {
                      reason = "ATTRIBUTE VALUE STARTS WITH HREF";
                      sev = 2;
                    } else if (a.nodeName.startsWith("on")) {
                      reason = "ATTRIBUTE VALUE STARTS WITH ON";
                      sev = 2;
                    }

                    domContexts.push({
                      HTMLNodeType: cur.parentNode.nodeName,
                      HTMLLocationType: "ATTRIBUTE VALUE",
                      EventContext: event.RawEvent.Data,
                      Severity: sev,
                      Reason: reason
                    });
                  }
                });
              }
              // Attach the DOM contexts to the event.
              event.DOMContexts = domContexts;
              // Attach the tracer that the event belongs to.
              event.TracerPayload = tp;

              return event;
            })
          )
      )
    );

    try {
      await Promise.all(eventsp.flat().map(database.addEvent));
    } catch (err) {
      console.error("[ADD EVENTS]", err);
    }
  });

  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name !== "processDOMEvents") return;
    processDOMEvents();
  });
  return { add: add };
})();
