(function() {
  chrome.storage.local.get({ restHost: "localhost", restPort: 8081 }, res => {
    const hookInjector = document.createElement("script");
    hookInjector.type = "text/javascript";
    hookInjector.innerHTML = `
window.tracy = {};
window.tracy.installed = true;
window.tracy.host = "${res.restHost}";
window.tracy.port = ${res.restPort}`;
    document.body.appendChild(hookInjector);
    hookInjector.parentNode.removeChild(hookInjector);
  });
})();
