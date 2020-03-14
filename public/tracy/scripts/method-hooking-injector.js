(function() {
  // injectScript injects the script into the page and then removes it.
  const injectScript = file => {
    const hookInjector = document.createElement("script");
    hookInjector.async = true;
    hookInjector.type = "text/javascript";
    hookInjector.src = chrome.runtime.getURL(`tracy/scripts/${file}`);
    hookInjector.id = "injected";
    document.documentElement.appendChild(hookInjector);
    hookInjector.parentNode.removeChild(hookInjector);
  };

  // Create a listener on the shared window between content scripts and injected
  // scripts so that injected scripts can talk to the extension via window.postMessage.
  window.addEventListener("tracyMessage", async ({ detail }) => {
    try {
      const respp = util.send(detail);
      if (detail.channel) {
        const resp = await respp;
        const event = new CustomEvent(`tracyResponse-${channel}`, {
          detail: resp
        });
        window.dispatchEvent(event);
      }
    } catch (e) {
      console.error(e);
    }
  });

  // A list of scripts we want to inject into the page rather than have them as
  // a content script.
  const injectionScripts = [
    "inner-html-mod.js",
    "xhr-mod.js",
    "fetch-mod.js",
    "replace.js",
    "form-mod.js"
  ];
  injectionScripts.map(injectScript);
})();
