(() => {
  // injectScript injects the script into the page and then removes it.
  const injectScript = (file) => {
    const hookInjector = document.createElement(Strings.SCRIPT);
    hookInjector.async = true;
    hookInjector.type = Strings.TEXT_JAVASCRIPT;
    hookInjector.src = chrome.runtime.getURL(`tracy/scripts/${file}`);
    hookInjector.id = Strings.INJECTED;
    document.documentElement.appendChild(hookInjector);
    hookInjector.parentNode.removeChild(hookInjector);
  };

  // Create a listener on the shared window between content scripts and injected
  // scripts so that injected scripts can talk to the extension via window.postMessage.
  window.addEventListener(EventTypes.TracyMessage, async ({ detail }) => {
    try {
      const { chan = null } = detail;
      let resp = await channel.send(detail);
      if (chan) {
        // cloneInto is for FF only. They don't allow passing custom objects
        // from a privileged script to an unprivileged script without this.
        if (typeof cloneInto !== Strings.UNDEFINED) {
          resp = cloneInto(resp, window);
        }
        channel.sendResponse(resp, chan);
      }
    } catch (e) {
      console.error("[PAGE <--> CS]", e);
    }
  });

  // A list of scripts we want to inject into the page rather than have them as
  // a content script.
  const injectionScripts = [
    "channel-page.js",
    "constants.js",
    "rpc.js",
    "screenshot-client.js",
    "inner-html-mod.js",
    "xhr-mod.js",
    "fetch-mod.js",
    "replace.js",
    "form-mod.js",
  ];
  injectionScripts.map(injectScript);
})();
