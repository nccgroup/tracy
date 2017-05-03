(function() {

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node){
          if(node.nodeType == 1){
            chrome.runtime.sendMessage({'type': 'dom', 'msg': node.outerHTML}, null);// For now we don't want to use the calback handler
          } else if (node.nodeType == 3) {
            chrome.runtime.sendMessage({'type': 'text', 'msg': node.wholeText}, null);// For now we don't want to use the calback handler
          }
      });
    });
  });

  var observerConfig = {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true
  };

  observer.observe(document.documentElement, observerConfig);

//hook the request method so that we an get the responseText
//Note: for now you will have to add the id in by hand
//I really need a way to load this from a file to. This way sucks to change
var script = `
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    console.log('request started!');
    this.addEventListener('load', function() {
        var editorExtensionId = "djdklnljiogflcponpaggloglcmgbicl";

        chrome.runtime.sendMessage(editorExtensionId, {'type': 'responseText', 'msg': this.responseText},
          function(response) {
            console.log("worked")
        });
    });
    origOpen.apply(this, arguments);
};
`;

var hooker = document.createElement("script");
hooker.type = "text/javascript";
hooker.textContent = script;
document.documentElement.appendChild(hooker);
hooker.parentNode.removeChild(hooker);

})();
