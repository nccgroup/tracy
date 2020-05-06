import { EventTypes, Strings, MessageTypes } from "../shared/constants";
import { addEvents, getTracers } from "./database";
import { sleep } from "../shared/ui-helpers";

// Process all the jobs in the current queue.
const loc = chrome.runtime.getURL("searchWorker.bundle.js");
const searchWorkers = [new Worker(loc), new Worker(loc), new Worker(loc)];
const pickSearchWorker = ((searchWorkers) => {
  let i = 0;
  return () => {
    const id = i++ % searchWorkers.length;
    return searchWorkers[id];
  };
})(searchWorkers);

const dp = new DOMParser();
const swHandler = async (e) => {
  const { id } = e.data;
  switch (id) {
    case MessageTypes.SearchString.id:
      const { domEvents } = e.data;
      // The only reason this isn't in a web worker is because I can't
      // copy the DOM nodes to the worker and I can't create a DOM parser in the worker.
      // The best we can do is use async :/
      domEvents.map(async (event) => {
        const dom = dp.parseFromString(event.RawEvent, Strings.TEXT_HTML);
        const tw = document.createTreeWalker(dom, NodeFilter.SHOW_ALL);
        // Search through the DOM event for instances of the tracer payload.
        // If one is found, assign it a severity rating and collect data about
        // its surrounding.
        const nodes = [];
        while (tw.nextNode()) {
          const {
            data,
            nodeType,
            nodeName,
            innerHTML,
            parentNode: { nodeName: parentNodeName },
            attributes,
            viewPortElement,
          } = tw.currentNode;
          const hasViewPortElement = viewPortElement ? true : false;
          nodes.push({
            data,
            nodeType,
            innerHTML,
            nodeName,
            parentNode: { nodeName: parentNodeName },
            viewportElement: hasViewPortElement,
            attributes: attributes
              ? [...attributes].map((a) => ({
                  nodeName: a.nodeName,
                  value: a.value,
                }))
              : null,
          });
        }
        parseDOM(event, nodes);
      });
      break;
    case MessageTypes.ParseDOM.id:
      const { parsedEvents } = e.data;
      if (parsedEvents.length === 0) {
        return;
      }

      addEvents(parsedEvents);
      break;
  }
};
searchWorkers.map((sw) =>
  sw.addEventListener(EventTypes.Message, swHandler, { passive: true })
);

export const parseDOM = async (event, nodes) => {
  const worker = pickSearchWorker();
  worker.postMessage({
    ...MessageTypes.ParseDOM,
    event,
    nodes,
  });
};

export const searchStringForInput = async (message) => {
  const worker = pickSearchWorker();
  // need to wait some for any tracers added by *-mod scripts
  // they take some time to enter the database.

  const tracers = await getTracers(2000);
  worker.postMessage({
    ...MessageTypes.SearchString,
    jobs: [message],
    tracerPayloads: tracers.map((t) => t.TracerPayload),
  });
};
