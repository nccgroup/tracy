const settings = (() => {
  // refresheConfig makes an API request for the latest config from `/config`,
  // pulls configuration from the extension settings page and gets a current
  // list of tracers. refreshConfig is usually called on page load.
  const refreshConfig = async wsConnect => {
    if (disabled) return;
    const s = await new Promise(r =>
      chrome.storage.local.get({ restHost: "127.0.0.1", restPort: 7777 }, res =>
        r(res)
      )
    );

    restServer = s.restHost + ":" + s.restPort;

    // TODO: move these to chrome storage
    fetch(`http://${restServer}/api/tracy/config`, { headers: { Hoot: "!" } })
      .then(res => res.json())
      .catch(err => console.error(err))
      .then(res => {
        tracerStringTypes = Object.keys(res["TracerStrings"]);

        // TODO: can't figure out why Firefox is throwing an error here
        // about duplicate IDs.
        let err;
        tracerStringTypes.forEach(i => {
          chrome.contextMenus.remove(i, () => {
            err = chrome.runtime.lastError;
            if (err) {
              //Don't really care about this error.
            }
            // Context menu for right-clicking on an editable field.
            chrome.contextMenus.create({
              id: i,
              title: i,
              contexts: ["editable"],
              onclick: (info, tab) => {
                chrome.tabs.sendMessage(tab.id, {
                  cmd: "clickCache",
                  tracerString: i
                });
              }
            });
          });
        });
      });

    fetch(`http://${restServer}/api/tracy/tracers`, { headers: { Hoot: "!" } })
      .then(res => res.json())
      .catch(err => console.error(err))
      .then(res => {
        if (!res) return;
        tracerPayloads = [].concat
          .apply(
            [],
            res.map(r => [].concat(r.Tracers.map(t => t.TracerPayload)))
          )
          .filter(t => t !== "");
      })
      .catch(err => console.error(err));

    if (wsConnect) {
      websocket.websocketConnect();
    }
  };

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
  let restServer = "127.0.0.1:443";
  let tracerStringTypes = ["Can't connect to API. Is Tracy running?"];
  let tracerPayloads = [];
  let disabled = false;

  // Update the configuration on every page load.
  chrome.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
      refreshConfig(false);
    }
  });
  refreshConfig();

  return {
    getServer: () => restServer,
    getTracerStrings: () => tracerStringTypes,
    getTracerPayloads: () => tracerPayloads,
    setTracerPayloads: tp => (tracerPayloads = tp),
    isDisabled: () => disabled,
    setDisabled: b => (disabled = b),
    query: query
  };
})();
