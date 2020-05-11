import { EventTypes, Strings } from "./constants";

export const channel = (() => {
  const send = (data) => {
    return new Promise((res, rej) => {
      chrome.runtime.sendMessage(data, (resp) => {
        const err = chrome.runtime.lastError;
        if (err) {
          rej(err);
          return;
        }

        res(resp);
      });
    });
  };
  const sendResponse = (resp, channel) => {
    // cloneInto is for FF only. They don't allow passing custom objects
    // from a privileged script to an unprivileged script without this.
    if (typeof cloneInto !== Strings.UNDEFINED) {
      resp = cloneInto(resp, window);
    }
    const event = new CustomEvent(`${EventTypes.TracyResponse}-${channel}`, {
      detail: resp,
    });
    window.dispatchEvent(event);
  };

  return { send, sendResponse };
})();
