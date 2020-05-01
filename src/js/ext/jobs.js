import { EventTypes, Strings, NodeTypeMappings } from "../shared/constants";
import { settings } from "./settings";
import { addEvents, getTracers } from "./database";
import prettier from "prettier/standalone";
import parserHTML from "prettier/parser-html";
import parserJSON from "prettier/parser-babel";
import { memoize } from "lodash";
export const jobs = (() => {
  // Bundles up all the requirements for making a job worker in case
  // in the future we need more than one worker.
  const createJobWorker = () => {
    // List of DOM writes. When a job is written to this array
    // the background page will wait a few seconds collecting more jobs
    // and then send them all off to the database.
    let j = [];
    // Process all the jobs in the current queue.
    const loc = chrome.runtime.getURL("searchWorker.bundle.js");
    const worker = new Worker(loc);
    const dp = new DOMParser();
    worker.addEventListener(EventTypes.Message, async (e) => {
      // The only reason this isn't in a web worker is because I can't
      // copy the DOM nodes to the worker and I can't create a DOM parser in the worker.
      // The best we can do is use async :/
      const events = (
        await Promise.all(
          e.data.map(async (event) => {
            const dom = dp.parseFromString(event.RawEvent, Strings.TEXT_HTML);
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
        )
      ).flat();

      return await addEvents(events);
    });

    return {
      processDOMEvents: async () => {
        const work = [...j];

        // Clear out the jobs.
        j = [];
        // Send any jobs off to the web worker.
        const tracers = await getTracers();
        worker.postMessage({
          jobs: work,
          tracerPayloads: tracers.map((t) => t.TracerPayload),
        });
      },
      add: async (message) => {
        if (settings.isDisabled()) {
          sendResponse();
          return;
        }
        // If it is the first job added, set a timer to process the jobs.
        if (j.length === 0) {
          chrome.alarms.create(Strings.PROCESS_DOM_EVENTS, {
            when: Date.now() + 1,
          });
        }
        j.push(message);
      },
      bulkAdd: async (message) => {
        if (settings.isDisabled()) {
          sendResponse();
          return;
        }

        // If it is the first job added, set a timer to process the jobs.
        if (j.length === 0) {
          chrome.alarms.create(Strings.PROCESS_DOM_EVENTS, {
            when: Date.now() + 1,
          });
        }

        message.msg.map((m) =>
          j.push(Object.assign(m, { location: message.location }))
        );
      },
    };
  };
  const worker = createJobWorker();
  const textCommentNodeCheck = (cur, event) => {
    if (
      cur.data.toLowerCase().indexOf(event.TracerPayload.toLowerCase()) !== -1
    ) {
      // Leaf node of a script tag has a little bit higher severity.
      if (
        NodeTypeMappings[cur.nodeType] == "TEXT_NODE" &&
        cur.parentNode.nodeName.toLowerCase() === Strings.SCRIPT
      ) {
        return [
          {
            HTMLNodeType: cur.parentNode.nodeName,
            HTMLLocationType: NodeTypeMappings[cur.nodeType],
            Severity: 1,
            Reason: "LEAF NODE SCRIPT TAG",
          },
        ];
      }
      // Otherwise, it's just a regular leaf, with no severity.
      return [
        {
          HTMLNodeType: cur.parentNode.nodeName,
          HTMLLocationType: NodeTypeMappings[cur.nodeType],
          Severity: 0,
          Reason: "LEAF",
        },
      ];
    }
    return [];
  };
  const svgNodeCheck = (cur, event) => {
    // SVG nodes don't have an innerText method
    if (cur.nodeName.toLowerCase() === Strings.SVG || cur.viewportElement) {
      if (
        cur.innerHTML
          .toLowerCase()
          .indexOf(event.TracerPayload.toLowerCase()) !== -1
      ) {
        let sev = 1;
        // Text writes indicate the DOM was written with an API such as .innerText.
        // These are likely not exploitable.
        if (event.EventType.toLowerCase() === Strings.TEXT) {
          sev = 0;
        }
        // Lead node of an SVG
        return [
          {
            HTMLNodeType: cur.parentNode.nodeName,
            HTMLLocationType: "TEXT",
            Severity: sev,
            Reason: "LEAF NODE SVG TAG",
          },
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
      if (event.EventType.toLowerCase() === Strings.TEXT) {
        sev = 0;
      }
      return [
        {
          HTMLNodeType: cur.parentNode.nodeName,
          HTMLLocationType: "NODE NAME",
          Severity: sev,
          Reason: "NODE NAME",
        },
      ];
    }
    return [];
  };

  const attributesCheck = (cur, event) => {
    // Checking the attributes
    return [...cur.attributes]
      .map((a) => {
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
          if (event.EventType.toLowerCase() === Strings.TEXT) {
            sev = 0;
          }
          agg = [
            ...agg,
            {
              HTMLNodeType: cur.nodeName,
              HTMLLocationType: "ATTRIBUTE NAME",
              Severity: sev,
              Reason: "ATTRIBUTE NAME",
            },
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
          if (a.nodeName === Strings.HREF && i === 0) {
            reason = "ATTRIBUTE VALUE STARTS WITH HREF";
            sev = 2;
          } else if (a.nodeName.startsWith(Strings.ON)) {
            reason = "ATTRIBUTE VALUE STARTS WITH ON";
            sev = 2;
          }

          // Text writes indicate the DOM was written with an API such as .innerText.
          // These are likely not exploitable.
          if (event.EventType.toLowerCase() === Strings.TEXT) {
            sev = 0;
          }

          agg = [
            ...agg,
            {
              HTMLNodeType: cur.nodeName,
              HTMLLocationType: "ATTRIBUTE VALUE",
              Severity: sev,
              Reason: reason,
            },
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
    // First only do the non-text and non-comment nodes since those are special cases.
    const svgNodeNameAttrContexts = nodes
      .filter(
        (cur) =>
          NodeTypeMappings[cur.nodeType] !== "TEXT_NODE" &&
          NodeTypeMappings[cur.nodeType] !== "COMMENT_NODE"
      )
      .map((cur) => [
        ...svgNodeCheck(cur, event),
        ...nodeNameCheck(cur, event),
        ...attributesCheck(cur, event),
      ]);

    // Then, do the text and comment nodes. These don't have innerText attributes
    const textCommentNodeContexts = nodes
      .filter(
        (cur) =>
          NodeTypeMappings[cur.nodeType] === "TEXT_NODE" ||
          NodeTypeMappings[cur.nodeType] === "COMMENT_NODE"
      )
      .map((cur) => [...textCommentNodeCheck(cur, event)]);

    const contexts = [
      ...svgNodeNameAttrContexts,
      ...textCommentNodeContexts,
    ].filter((e) => e.length !== 0);

    // before submitting the event, prettify it and truncate it
    const [prettyEvent, type] = prettify(event.RawEvent);
    return contexts.map((c, i) => {
      const [snippet, lineNum] = substringAround(
        prettyEvent,
        event.TracerPayload,
        1000,
        i
      );
      return {
        ...event,
        ...c.pop(),
        TracerPayload: event.TracerPayload,
        RawEvent: snippet,
        RawEventType: type,
        RawEventIndex: lineNum,
      };
    });
  };
  const isJSON = (rawEvent) => {
    try {
      JSON.parse(rawEvent);
      return true;
    } catch (e) {}

    return false;
  };
  const isHTML = (rawEvent) =>
    rawEvent.indexOf("<") !== -1 && rawEvent.indexOf(">") !== -1;

  const isJavaScript = (rawEvent) => {
    try {
      return [
        true,
        prettier.format(rawEvent, {
          parser: "babel",
          plugins: [parserJSON],
        }),
      ];
    } catch (e) {}

    return [false, null];
  };
  const prettify = memoize((rawEvent) => {
    if (isJSON(rawEvent)) {
      return [
        prettier.format(rawEvent, {
          parser: "json",
          plugins: [parserJSON],
        }),
        "application/json",
      ];
    }

    const [parsed, parsedJS] = isJavaScript(rawEvent);
    if (parsed) {
      return [parsedJS, "application/javascript"];
    }
    if (isHTML(rawEvent)) {
      try {
        const html = prettier.format(rawEvent, {
          parser: "html",
          plugins: [parserHTML],
        });
        return [html, "text/html"];
      } catch (e) {
        return [rawEvent, "text/html"];
      }
    }

    if (DEV) {
      console.error("AHH WHAT IS IT", rawEvent);
    }

    return [rawEvent, "text/html"];
  });

  const uniqueStr = "zzFINDMEzz";
  const substringAround = (str, substr, padding, instance) => {
    const instances = str.split(substr);
    if (instances.length === 1) {
      return "";
    }

    if (instance + 1 > instances.length - 1) {
      console.error(
        `Requesting too many instances ${instance} of ${substr} in ${str}`
      );
      return "";
    }

    // go back until we have no more instances or the length of the left side
    // is greater than or equal to the padding
    let leftPad = "";
    for (let i = instance; leftPad.length < padding && i >= 0; i--) {
      leftPad = instances[i] + substr + leftPad;
    }
    // then truncate the padding
    leftPad = leftPad.substring(leftPad.length - padding, leftPad.length);

    let rightPad = "";
    for (
      let i = instance + 1;
      rightPad.length < padding && i < instances.length;
      i++
    ) {
      rightPad += instances[i] + substr;
    }
    // remove the last substr
    rightPad = rightPad.substring(0, rightPad.length - substr.length);
    rightPad = rightPad.substring(0, padding);

    const snippet = leftPad + uniqueStr + rightPad;

    const lineNum = snippet
      .split("\n")
      .map((l, i) => (l.indexOf(uniqueStr) !== -1 ? i + 1 : null))
      .filter(Boolean)
      .pop();

    return [snippet.replace(uniqueStr, ""), lineNum];
  };

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== Strings.PROCESS_DOM_EVENTS) {
      return;
    }
    worker.processDOMEvents();
  });
  return { add: worker.add, bulkAdd: worker.bulkAdd };
})();
