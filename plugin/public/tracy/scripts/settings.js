const settings = (() => {
  // refresheConfig makes an API request for the latest config from `/config`,
  // pulls configuration from the extension settings page and gets a current
  // list of tracers. refreshConfig is usually called on page load.
  const refreshConfig = async () => {
    if (disabled) return;
    const s = await new Promise(r =>
      chrome.storage.local.get(
        { restHost: "127.0.0.1", restPort: 7777, apiKey: "" },
        res => r(res)
      )
    );

    restServer = s.restHost + ":" + s.restPort;
    apiKey = s.apiKey;
    const { json, err } = await background.fetch({
      method: "GET",
      route: "/api/tracy/tracers"
    });
    if (err) {
      console.error(err);
      return;
    }
    tracerPayloads = json.map(r => r.TracerPayload).filter(t => t !== "");
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

  const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // getTracerPaylods returns the current collected payloads. Sometimes, we
  //  want to wait for some events to come in that would add a tracer that
  // we can't block the browser from, so this function takes an optional delay
  // option in miliseconds before resolving the promise.
  const promiseMap = {};

  chrome.alarms.onAlarm.addListener(alarm => {
    if (!alarm.name.startsWith("deliver-")) {
      return;
    }
    // Get the promise associated with this alarm and deliver
    // the current set of tracer payloads for it.
    const rand = alarm.name.split("deliver-")[1];
    const resolve = promiseMap[rand];
    resolve(tracerPayloads);
    // Delete the promise from the promise map.
    delete promiseMap[rand];
  });

  const getTracerPayloads = (delay = 500) => {
    return new Promise(r => {
      const rand = getRandomInt(0, 1000000000);
      promiseMap[`${rand}`] = r;
      chrome.alarms.create(`deliver-${rand}`, {
        when: Date.now() + delay
      });
    });
  };

  // Configuration defaults
  let restServer = "127.0.0.1:443";
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

  let tracerPayloads = [];
  let disabled = false;
  let apiKey = "";
  // Update the configuration on every page load.
  chrome.tabs.onUpdated.addListener((tabID, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
      refreshConfig();
    }
  });
  refreshConfig();

  return {
    getServer: () => restServer,
    getTracerStrings: () => tracerStringTypes,
    getTracerPayloads: getTracerPayloads,
    setTracerPayloads: tp => (tracerPayloads = tp),
    isDisabled: () => disabled,
    setDisabled: b => (disabled = b),
    query: query
  };
})();