/* Code used to set up listeners for all DOM writes. */
(function(){
    var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node){
          if(node.nodeType == 1){
            chrome.runtime.sendMessage({'type': 'dom', 'msg': node.outerHTML}, null);// For now we don't want to use the callback handler
          } else if (node.nodeType == 3) {
            chrome.runtime.sendMessage({'type': 'text', 'msg': node.wholeText}, null);// For now we don't want to use the callback handler
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
})();

