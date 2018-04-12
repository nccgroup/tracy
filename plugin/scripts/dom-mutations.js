/* Code used to set up listeners for all DOM writes. */
(function() {
  chrome.runtime.sendMessage(
    {
      "message-type": "config",
      config: "enabled"
    },
    enabled => {
      if (enabled) {
        console.log("Plugin is enabled");
        chrome.runtime.sendMessage({
          "message-type": "refresh"
        });

        /* This observer will be used to observe changes in the DOM. It will batches DOM changes and send them to the API
         * server if it finds a tracer string. */
        var observer = new MutationObserver(function(mutations) {
          var parentNode = null;

          mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
              mutation.addedNodes.forEach(function(node) {
                /* Check to see if a node is a child of the parentNode if so don't add it because we already have that data */
                if (parentNode == null || !parentNode.contains(node)) {
                  /* The only supported DOM types that we care about are `DOM` (1) and `text` (3). */
                  if (node.nodeType == 1) {
                    /* In the case of a DOM type, check all the node's children for input fields. Use this as a chance
                 * to restyle new inputs that were not caught earlier. */
                    parentNode = node;
                    chrome.runtime.sendMessage({
                      "message-type": "job",
                      type: "dom",
                      msg: node.outerHTML,
                      location: document.location.href
                    });
                    clickToFill(node);
                  } else if (node.nodeType == 3) {
                    chrome.runtime.sendMessage({
                      "message-type": "job",
                      type: "text",
                      msg: node.textContent,
                      location: document.location.href
                    });
                  }
                }
              }, this);
            } else {
              if (mutation.type == "attributes") {
                chrome.runtime.sendMessage({
                  "message-type": "job",
                  type: "dom",
                  msg: mutation.target.outerHTML,
                  location: document.location.href
                });
              } else if (mutation.type == "characterData") {
                chrome.runtime.sendMessage({
                  "message-type": "job",
                  type: "dom",
                  msg: mutation.target.parentNode.outerHTML,
                  location: document.location.href
                });
              }
            }
          }, this);
        });

        /* The configuration for the observer. We want to pretty much watch for everything. */
        var observerConfig = {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true
        };

        observer.observe(document.documentElement, observerConfig);
      } else {
        if (observer) {
          observer.disconnect();
        }
      }
    }
  );
})();
