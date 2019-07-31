const util = (() => {
  // send wraps the Chrome sendMessage API in a promise.
  const send = data => {
    return new Promise((res, rej) => {
      chrome.runtime.sendMessage(data, resp => {
        const err = chrome.runtime.lastError;
        if (err) {
          rej(err);
          return;
        }

        res(resp);
      });
    });
  };

  // get wraps the Chrome get storage API in a promise.
  const get = data => {
    return new Promise((res, rej) => {
      chrome.storage.local.get(data, resp => {
        const err = chrome.runtime.lastError;
        if (err) {
          rej(err);
          return;
        }

        res(resp);
      });
    });
  };

  return {
    get: get,
    send: send
  };
})();
