(function() {
  // Create a listener on the shared window between content scripts and injected
  // scripts so that injected scripts can talk to the extension via window.postMessage.
  window.addEventListener("message", event => {
    chrome.runtime.sendMessage(event.data);
  });

  // A list of scripts we want to inject into the page rather than have them as a
  // content script.
  const injectionScripts = ["innerhtml.js"];
  // Inject the scripts.
  injectionScripts.map(getInjectionSrc).map(injectScript);

  /*getInjectionSrc returns the file path of the script we are trying to inject */
  function getInjectionSrc(file) {
    return chrome.runtime.getURL(`scripts/${file}`);
  }

  /*injectScript injects the script into the page and then removes it. */
  function injectScript(src) {
    const hookInjector = document.createElement("script");
    hookInjector.type = "text/javascript";
    hookInjector.src = src;
    document.documentElement.appendChild(hookInjector);
    hookInjector.parentNode.removeChild(hookInjector); // TODO: do we need to remove it?
  }
})();
