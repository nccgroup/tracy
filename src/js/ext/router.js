import { jobs } from "./jobs";
import { settings } from "./settings";
import { screenshot } from "./screenshot";
import { database } from "./database";
import { MessageTypes } from "../shared/constants";
export const routerInit = () => {
  // Routes messages from the extension to various functions on the background.
  const messageRouter = (message, sender, sendResponse) => {
    const { id } = message;
    switch (id) {
      case MessageTypes.InnerHTML.id:
        jobs.add(message, sender, sendResponse);
        break;
      case MessageTypes.BulkJobs.id:
        jobs.bulkAdd(message, sender, sendResponse);
        break;
      case MessageTypes.GetTracerStrings.id:
        settings.query(message, sender, sendResponse);
        return true;
      case MessageTypes.Screenshot.id:
        screenshot.take(sender, sendResponse);
        return true;
      case MessageTypes.AddTracer.id:
        (async () => {
          try {
            const t = await databaseQuery(message);
            sendResponse(t);
          } catch (e) {
            console.error("DATABASE ERROR", e);
            // Send an empty response to make sure the UI doesn't get stuck.
            sendResponse([]);
          }
        })();
        return true;
      default:
        sendResponse({});
    }
  };

  const databaseQuery = async (message) => {
    const { query } = message;
    switch (query) {
      case MessageTypes.GetTracers.query:
        return database.getTracers();
      case MessageTypes.GetTracerEvents.query:
        const { tracerPayload } = message;
        return database.getTracerEventsByPayload(tracerPayload);
      case MessageTypes.AddTracer.query:
        const { tracer } = message;
        return database.addTracer(tracer);
      default:
        console.log("[BAD MESSAGE QUERY]", query);
        return Promise.resolve("BAD");
    }
  };
  chrome.runtime.onMessage.addListener(messageRouter);
};
