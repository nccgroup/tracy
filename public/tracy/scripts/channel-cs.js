const channel = (() => {
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
    const event = new CustomEvent(`${EventTypes.TracyResponse}-${channel}`, {
      detail: resp,
    });
    window.dispatchEvent(event);
  };

  return { send, sendResponse };
})();
