(function() {

  window.addEventListener("message", function(event) {

    if (event.source != window)
        return;

    chrome.runtime.sendMessage({'type': event.data.type, 'msg': event.data.msg,"location": document.location}, null);
  });

  //Inject our hooks now that we have a global varable we can refer to
  var hookInjector = document.createElement("script");
  hookInjector.type = "text/javascript";
  hookInjector.src = "chrome-extension://" + chrome.runtime.id +  "/scripts/method-hooking.js";//Change this to chrome.extension.getURL
  document.documentElement.appendChild(hookInjector);
  hookInjector.parentNode.removeChild(hookInjector);
})();
