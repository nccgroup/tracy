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
      // The only reason this isn't in a web worker is because I can't
      // copy the DOM nodes to the worker and I can't create a DOM parser in the worker.
      // The best we can do is use async :/
      const events = (await Promise.all(
        e.data.map(async event => {
          const dom = dp.parseFromString(event.RawEvent, "text/html");
          const tw = document.createTreeWalker(dom, NodeFilter.SHOW_ALL);
          // Search through the DOM event for instances of the tracer payload.
          // If one is found, assign it a severity rating and collect data about
          // its surrounding.
          const nodes = [];
          while (tw.nextNode()) {
            nodes.push(tw.currentNode);
          }
          return findDOMContexts(event, nodes);
        })
      )).flat();

      return await database.addEvents(events);
    });

    return {
      processDOMEvents: async () => {
        const work = [...j];

        // Clear out the jobs.
        j = [];
        // Send any jobs off to the web worker.
        const tracers = await database.getTracers();
        worker.postMessage({
          type: "search",
          jobs: work,
          tracerPayloads: tracers.map(t => t.TracerPayload)
        });
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
  const textCommentNodeCheck = (cur, event) => {
    if (
      cur.data.toLowerCase().indexOf(event.TracerPayload.toLowerCase()) !== -1
    ) {
      // Leaf node of a script tag has a little bit higher severity.
      if (
        nodeType[cur.nodeType] == "TEXT_NODE" &&
        cur.parentNode.nodeName.toLowerCase() === "script"
      ) {
        return [
          {
            HTMLNodeType: cur.parentNode.nodeName,
            HTMLLocationType: nodeType[cur.nodeType],
            Severity: 1,
            Reason: "LEAF NODE SCRIPT TAG"
          }
        ];
      }
      // Otherwise, it's just a regular leaf, with no severity.
      return [
        {
          HTMLNodeType: cur.parentNode.nodeName,
          HTMLLocationType: nodeType[cur.nodeType],
          Severity: 0,
          Reason: "LEAF"
        }
      ];
    }
    return [];
  };
  const svgNodeCheck = (cur, event) => {
    // SVG nodes don't have an innerText method
    if (cur.nodeName.toLowerCase() === "svg" || cur.viewportElement) {
      if (
        cur.innerHTML
          .toLowerCase()
          .indexOf(event.TracerPayload.toLowerCase()) !== -1
      ) {
        let sev = 1;
        // Text writes indicate the DOM was written with an API such as .innerText.
        // These are likely not exploitable.
        if (event.EventType.toLowerCase() === "text") {
          sev = 0;
        }
        // Lead node of an SVG
        return [
          {
            HTMLNodeType: cur.parentNode.nodeName,
            HTMLLocationType: "TEXT",
            Severity: sev,
            Reason: "LEAF NODE SVG TAG"
          }
        ];
      }
    }
    return [];
  };

  const nodeNameCheck = (cur, event) => {
    // Checking the node names
    if (
      cur.nodeName.toLowerCase().indexOf(event.TracerPayload.toLowerCase()) !==
      -1
    ) {
      let sev = 3;
      // Text writes indicate the DOM was written with an API such as .innerText.
      // These are likely not exploitable.
      if (event.EventType.toLowerCase() === "text") {
        sev = 0;
      }
      return [
        {
          HTMLNodeType: cur.parentNode.nodeName,
          HTMLLocationType: "NODE NAME",
          Severity: sev,
          Reason: "NODE NAME"
        }
      ];
    }
    return [];
  };

  const attributesCheck = (cur, event) => {
    // Checking the attributes
    return [...cur.attributes]
      .map(a => {
        let agg = [];
        // the attribute name contains a tracer
        if (
          a.nodeName
            .toLowerCase()
            .indexOf(event.TracerPayload.toLowerCase()) !== -1
        ) {
          let sev = 3;
          // Text writes indicate the DOM was written with an API such as .innerText.
          // These are likely not exploitable.
          if (event.EventType.toLowerCase() === "text") {
            sev = 0;
          }
          agg = [
            ...agg,
            {
              HTMLNodeType: cur.nodeName,
              HTMLLocationType: "ATTRIBUTE NAME",
              Severity: sev,
              Reason: "ATTRIBUTE NAME"
            }
          ];
        }

        // the attribute value contains a tracer
        const i = a.value
          .toLowerCase()
          .indexOf(event.TracerPayload.toLowerCase());
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

          // Text writes indicate the DOM was written with an API such as .innerText.
          // These are likely not exploitable.
          if (event.EventType.toLowerCase() === "text") {
            sev = 0;
          }

          agg = [
            ...agg,
            {
              HTMLNodeType: cur.nodeName,
              HTMLLocationType: "ATTRIBUTE VALUE",
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
  const findDOMContexts = (event, nodes) => {
    const contexts = [
      // First only do the non-text and non-comment nodes since those are special cases.
      ...nodes
        .filter(
          cur =>
            nodeType[cur.nodeType] !== "TEXT_NODE" &&
            nodeType[cur.nodeType] !== "COMMENT_NODE"
        )
        .map(cur => [
          ...svgNodeCheck(cur, event),
          ...nodeNameCheck(cur, event),
          ...attributesCheck(cur, event)
        ]),
      // Then, do the text and comment nodes. These don't have innerText attributes
      ...nodes
        .filter(
          cur =>
            nodeType[cur.nodeType] === "TEXT_NODE" ||
            nodeType[cur.nodeType] === "COMMENT_NODE"
        )
        .map(cur => [...textCommentNodeCheck(cur, event)])
    ]
      .filter(e => e.length !== 0)
      .map((c, i) => ({
        ...event,
        ...c.pop(),
        TracerPayload: event.TracerPayload,
        RawEventIndex: i
      }));
    return contexts;
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
