(function() {
  // This observer will be used to observe changes in the DOM. It will batches
  // DOM changes and send them to the API/ server if it finds a tracer string.
  const observer = new MutationObserver(mutations => {
    let parentNode = null;

    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          // Check to see if a node is a child of the parentNode if so don't add
          // it because we already have that data
          if (parentNode === null || !parentNode.contains(node)) {
            // The only supported DOM types that we care about are `DOM` (1) and
            // `text` (3).
            if (node.name !== "injected") {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // In the case of a DOM type, check all the node's children for
                // input fields. Use this as a chance to restyle new inputs that
                // were not caught earlier.
                parentNode = node;
                util.send({
                  "message-type": "job",
                  type: "dom",
                  msg: node.outerHTML,
                  location: document.location.href
                });
                highlight.clickToFill(node);
              } else if (node.nodeType == Node.TEXT_NODE) {
                util.send({
                  "message-type": "job",
                  type: "text",
                  msg: node.textContent,
                  location: document.location.href
                });
              }
            }
          }
        }, this);
      } else {
        if (mutation.type == "attributes") {
          util.send({
            "message-type": "job",
            type: "dom",
            msg: mutation.target.outerHTML,
            location: document.location.href
          });
        } else if (mutation.type == "characterData") {
          util.send({
            "message-type": "job",
            type: "dom",
            msg: mutation.target.parentNode.outerHTML,
            location: document.location.href
          });
        }
      }
    }, this);
  });

  // The configuration for the observer. We want to pretty much watch for everything.
  const observerConfig = {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true
  };

  observer.observe(document.documentElement, observerConfig);
})();
