const util = (function() {
  // send wraps the Chrome sendMessage API in a promise.
  const send = async data => {
    const stack = Error().stack;

    return await new Promise((res, rej) => {
      try {
        chrome.runtime.sendMessage(data, resp => {
          const err = chrome.runtime.lastError;
          if (err) {
            throw err;
          }

          res(resp);
        });
      } catch (e) {
        console.error("[SEND->BACKGROUND]", e, stack);
        rej(e);
      }
    });
  };

  // get wraps the Chrome get storage API in a promise.
  const get = async data => {
    const stack = Error().stack;

    return await new Promise((res, rej) => {
      try {
        chrome.storage.local.get(data, resp => {
          const err = chrome.runtime.lastError;
          if (err) {
            throw err;
          }

          res(resp);
        });
      } catch (e) {
        console.error("[GET->BACKGROUND]", e, stack);
        rej(e);
      }
    });
  };

  return {
    get: get,
    send: send
  };
})();
