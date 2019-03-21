(function() {
  // Create a listener on the shared window between content scripts and injected
  // scripts so that injected scripts can talk to the extension via window.postMessage.
  window.addEventListener("message", event => {
    chrome.runtime.sendMessage(event.data);
  });

  const res = util.get({ restHost: "localhost", restPort: 8081 });
  const hookInjector = document.createElement("script");
  hookInjector.type = "text/javascript";
  hookInjector.id = "injected";
  hookInjector.innerHTML = `
window.tracy = {};
window.tracy.installed = true;
window.tracy.host = "${res.restHost}";
window.tracy.port = ${res.restPort}`;
  window.addEventListener("load", event => {
    document.body.appendChild(hookInjector);
    hookInjector.parentNode.removeChild(hookInjector);
  });
})();
