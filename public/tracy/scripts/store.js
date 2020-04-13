const store = {
  set: (data) => {
    return new Promise((res, rej) => {
      chrome.storage.local.set(data, (resp) => {
        const err = chrome.runtime.lastError;
        if (err) {
          rej(err);
          return;
        }

        res(resp);
      });
    });
  },
  get: (data) => {
    return new Promise((res, rej) => {
      chrome.storage.local.get(data, (resp) => {
        const err = chrome.runtime.lastError;
        if (err) {
          rej(err);
          return;
        }

        res(resp);
      });
    });
  },
};
