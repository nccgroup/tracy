import { jobs } from "./jobs";
import { settings } from "./settings";
import { take } from "./screenshot";
import { databaseQuery } from "./database";
import { MessageTypes } from "../shared/constants";
export const routerInit = () => {
  const messageRouter = async (message, sender, sendResponse) => {
    let ans = {};
    const { id } = message;
    switch (id) {
      case MessageTypes.InnerHTML.id:
        ans = await jobs.add(message);
        break;
      case MessageTypes.BulkJobs.id:
        ans = await jobs.bulkAdd(message);
        break;
      case MessageTypes.GetTracerStrings.id:
        ans = await settings.query(message);
        break;
      case MessageTypes.Screenshot.id:
        ans = await take(sender);
        break;
      case MessageTypes.AddTracer.id:
        ans = await databaseQuery(message);
        break;
      default:
        console.error(`[ROUTER]: Wrong message ID:`, message);
    }

    sendResponse(ans);
  };
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    messageRouter(message, sender, sendResponse);
    return true;
  });
};
