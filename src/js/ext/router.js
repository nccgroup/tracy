import { searchStringForInput } from "./jobs";
import { settings } from "./settings";
import { takeAndAddTracer } from "./screenshot";
import { databaseQuery } from "./database";
import { MessageTypes } from "../shared/constants";
import { printSize } from "../shared/ui-helpers";
export const routerInit = () => {
  const messageRouter = async (message, sender, sendResponse) => {
    let ans = {};
    try {
      printSize(message, "[CS --> BACKGROUND SIZE]");

      const { id } = message;
      switch (id) {
        case MessageTypes.DOMJob.id:
        case MessageTypes.InnerHTML.id:
          ans = await searchStringForInput(message);
          break;
        case MessageTypes.GetTracerStrings.id:
          ans = await settings.query(message);
          break;
        case MessageTypes.Screenshot.id:
          ans = await takeAndAddTracer(message, sender);
          break;
        case MessageTypes.AddTracer.id:
          ans = await databaseQuery(message);
          break;
        default:
          console.error(`[ROUTER]: Wrong message ID:`, message);
      }

      printSize(ans, "[CS <-- BACKGROUND SIZE]");

      sendResponse(ans);
    } catch (e) {
      console.error("[BACKGROUND ERROR]", e);
      sendResponse({ error: e });
    }
  };
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    messageRouter(message, sender, sendResponse);
    return true;
  });
};
