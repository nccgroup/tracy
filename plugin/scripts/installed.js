(function() {
  // Create a listener on the shared window between content scripts and injected
  // scripts so that injected scripts can talk to the extension via window.postMessage.
  window.addEventListener("message", event => {
    chrome.runtime.sendMessage(event.data);
  });

  (async () => {
    const res = await util.get({ restHost: "localhost", restPort: 7777 });
    const hookInjector = document.createElement("script");
    hookInjector.type = "text/javascript";
    hookInjector.name = "injected";
    hookInjector.innerHTML = `
window.tracy = {};
window.tracy.installed = true;
window.tracy.host = "${res.restHost}";
window.tracy.port = ${res.restPort}`;
    document.body.appendChild(hookInjector);
    hookInjector.parentNode.removeChild(hookInjector);
  })();
})();
