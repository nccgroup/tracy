const jobs = (() => {
  // Bundles up all the requirements for making a job worker in case
  // in the future we need more than one worker.
  const createJobWorker = () => {
    // List of DOM writes. When a job is written to this array
    // the background page will wait a few seconds collecting more jobs
    // and then send them all off to the database.
    let j = [];
    // Process all the jobs in the current queue.
    const loc = chrome.runtime.getURL("tracy/scripts/worker.js");
    const worker = new Worker(loc);
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
        tps.map(async tp => {
          const events = await Promise.all(
            e.data.map(async event => {
              const dom = dp.parseFromString(event.RawEvent, "text/html");
              const tw = document.createTreeWalker(dom, NodeFilter.SHOW_ALL);
              return findDOMContexts(event, tp, tw);
            })
          );
          return events.flat();
        })
      );

      try {
        await Promise.all(eventsp.flat().map(database.addEvent));
      } catch (err) {
        // This database call will probably throw a lot of errors because of
        // duplicate entries for events. I don't think we need to worry too much.
      }
    });

    return {
      processDOMEvents: async () => {
        // Send any jobs off to the web worker.
        const tracers = await database.getTracers();
        worker.postMessage({
          type: "search",
          jobs: j,
          tracerPayloads: tracers.map(t => t.TracerPayload)
        });

        // Clear out the jobs.
        j = [];
      },
      add: async (message, sender, sendResponse) => {
        if (!settings.isDisabled()) {
          // If it is the first job added, set a timer to process the jobs.
          if (j.length === 0) {
            chrome.alarms.create("processDOMEvents", {
              when: Date.now() + 1500
            });
          }
          j.push(message);
        }

        // This is needed for the general way we pass messages to the background.
        // All message handlers need to return something.
        sendResponse(true);
      }
    };
  };
  const worker = createJobWorker();
  const textCommentNodeCheck = (cur, event, tp) => {
    if (cur.data.toLowerCase().indexOf(tp.toLowerCase()) !== -1) {
      return [
        {
          HTMLNodeType: cur.parentNode.nodeName,
          HTMLLocationType: nodeType[cur.nodeType],
          EventContext: event.RawEvent,
          Severity: 0,
          Reason: "LEAF"
        }
      ];
    }
    return [];
  };
  const leafNodeCheck = (cur, event, tp) => {
    // SVG nodes don't have an innerText method
    if (cur.nodeName.toLowerCase() === "svg" || cur.viewportElement) {
      if (cur.innerHTML.toLowerCase().indexOf(tp.toLowerCase()) !== -1) {
        // Lead node of an SVG
        return [
          {
            HTMLNodeType: cur.parentNode.nodeName,
            HTMLLocationType: "TEXT",
            EventContext: event.RawEvent,
            Severity: 1,
            Reason: "LEAF NODE SVG TAG"
          }
        ];
      }
    } else {
      // Check for leaf nodes.
      if (cur.innerText.toLowerCase().indexOf(tp.toLowerCase()) !== -1) {
        // Lead node of a script tage
        if (cur.parentNode.nodeName.toLowerCase() === "script") {
          return [
            {
              HTMLNodeType: cur.parentNode.nodeName,
              HTMLLocationType: "TEXT",
              EventContext: event.RawEvent,
              Severity: 1,
              Reason: "LEAF NODE SCRIPT TAG"
            }
          ];
        }
      }
    }
    return [];
  };

  const nodeNameCheck = (cur, event, tp) => {
    // Checking the node names
    if (cur.nodeName.toLowerCase().indexOf(tp.toLowerCase()) !== -1) {
      sev = 3;
      reason = "TAG NAME";

      return [
        {
          HTMLNodeType: cur.parentNode.nodeName,
          HTMLLocationType: "NODE NAME",
          EventContext: event.RawEvent,
          Severity: 3,
          Reason: "NODE NAME"
        }
      ];
    }
    return [];
  };

  const attributesCheck = (cur, event, tp) => {
    // Checking the attributes
    return [...cur.attributes]
      .map(a => {
        let agg = [];
        // the attribute name contains a tracer
        if (a.nodeName.toLowerCase().indexOf(tp.toLowerCase()) !== -1) {
          agg = [
            ...agg,
            {
              HTMLNodeType: cur.parentNode.nodeName,
              HTMLLocationType: "ATTRIBUTE NAME",
              EventContext: event.RawEvent,
              Severity: 3,
              Reason: "ATTRIBUTE NAME"
            }
          ];
        }

        // the attribute value contains a tracer
        const i = a.value.toLowerCase().indexOf(tp.toLowerCase());
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

          agg = [
            ...agg,
            {
              HTMLNodeType: cur.parentNode.nodeName,
              HTMLLocationType: "ATTRIBUTE VALUE",
              EventContext: event.RawEvent,
              Severity: sev,
              Reason: reason
            }
          ];
        }

        return agg;
      })
      .flat();
  };

  // findDOMContexts parses the raw event string from a DOM write uses their
  // DOMParser API and TreeWalker API. Based on the placement of the tracer
  // payload in the DOM, it assigns severities to all areas where a tracer
  // payload is written to the DOM. Returns an arrays of events.
  const findDOMContexts = (event, tp, tw) => {
    // Search through the DOM event for instances of the tracer payload.
    // If one is found, assign it a severity rating and collect data about
    // its surrounding.
    const nodes = [];
    while (tw.nextNode()) {
      nodes.push(tw.currentNode);
    }
    return [
      // First only do the non-text and non-comment nodes since those are special cases.
      ...nodes
        .filter(
          cur =>
            nodeType[cur.nodeType] !== "TEXT_NODE" &&
            nodeType[cur.nodeType] !== "COMMENT_NODE"
        )
        .map(cur => [
          ...leafNodeCheck(cur, event, tp),
          ...nodeNameCheck(cur, event, tp),
          ...attributesCheck(cur, event, tp)
        ]),
      // Then, do the text and comment nodes. These don't have innerText attributes
      ...nodes
        .filter(
          cur =>
            nodeType[cur.nodeType] === "TEXT_NODE" ||
            nodeType[cur.nodeType] === "COMMENT_NODE"
        )
        .map(cur => [...textCommentNodeCheck(cur, event, tp)])
    ]
      .filter(e => e.length !== 0)
      .map(c => ({
        ...event,
        ...c.pop(),
        TracerPayload: tp
      }));
  };

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

  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name !== "processDOMEvents") return;
    worker.processDOMEvents();
  });
  return { add: worker.add };
})();
