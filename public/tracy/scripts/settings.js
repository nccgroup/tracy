const settings = (() => {
  // Stolen from : https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  const generateUUID = () =>
    ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );

  // configQuery returns the appropriate configuration information
  // that is requested from the content script.
  const query = (message, sender, sendResponse) => {
    if (message && message.config) {
      switch (message.config) {
        case "tracer-string-types":
          sendResponse(tracerStringTypes);
          break;
        case "disabled":
          sendResponse(disabled);
          break;
      }
    }
  };

  // Configuration defaults
  // TODO: move these to chrome storage
  const tracerSwap = "[[ID]]";
  let tracerStringTypes = [
    ["zzXSSzz", `\\"'<${tracerSwap}>`],
    ["GEN-XSS", `\\"'<${tracerSwap}>`],
    ["GEN-PLAIN", `${tracerSwap}`],
    ["zzPLAINzz", `${tracerSwap}`]
  ];
  // TODO: can't figure out why Firefox is throwing an error here
  // about duplicate IDs.
  let err;
  tracerStringTypes.forEach(i => {
    chrome.contextMenus.remove(i[0], () => {
      err = chrome.runtime.lastError;
      if (err) {
        //Don't really care about this error.
      }
      // Context menu for right-clicking on an editable field.
      chrome.contextMenus.create({
        id: i[0],
        title: i[0],
        contexts: ["editable"],
        onclick: (info, tab) => {
          chrome.tabs.sendMessage(tab.id, {
            cmd: "clickCache",
            tracerString: i[0]
          });
        }
      });
    });
  });

  let disabled = false;
  const getAPIKey = async () =>
    await new Promise(r =>
      chrome.storage.local.get({ apiKey: "" }, res => {
        let { apiKey } = res;
        if (!apiKey) {
          let apiKey = generateUUID();
          chrome.storage.local.set({ apiKey: apiKey });
        }

        r(apiKey);
      })
    );

  return {
    getTracerStrings: () => tracerStringTypes,
    getAPIKey: getAPIKey,
    isDisabled: () => disabled,
    setDisabled: b => (disabled = b),
    query: query
  };
})();
