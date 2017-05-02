(function() {
  var worker = new Worker('xxterminatorworker.js');

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node){

          if(node.nodeType == 1){
            console.log(node.outerHTML);
            worker.postMessage({'type': 'dom', 'msg': node.outerHTML});
          } else if (node.nodeType == 3) {
            console.log(node.wholeText);
            worker.postMessage({'type': 'text', 'msg': node.wholeText});
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

var script = `
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    console.log('request started!');
    this.addEventListener('load', function() {
        console.log(this.responseText);
        var editorExtensionId = "djdklnljiogflcponpaggloglcmgbicl";

        // Make a simple request:
        chrome.runtime.sendMessage(editorExtensionId, {openUrlInEditor: "test"},
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
