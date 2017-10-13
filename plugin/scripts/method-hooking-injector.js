(function() {

  window.addEventListener("message", function(event) {

    if (event.source != window)
        return;

    chrome.runtime.sendMessage({'type': event.data.type, 'msg': event.data.msg,"location": document.location.href}, null);
  });

  //Inject our hooks now that we have a global varable we can refer to
  var hookInjector = document.createElement("script");
  hookInjector.type = "text/javascript";
  hookInjector.src = chrome.runtime.getURL("/scripts/method-hooking.js");
  document.documentElement.appendChild(hookInjector);
  hookInjector.parentNode.removeChild(hookInjector);
})();
