(() => {
  const addedNodeHandler = (parentNode, addedNodes, i) => {
    const node = addedNodes[i];
    // Ignore scripts injected from the background page.
    if (
      node.src &&
      (node.src.startsWith("moz-extension") ||
        node.src.startsWith("chrome-extension"))
    ) {
      return nextStep(parentNode, addedNodes, i + 1);
    }
    // Check to see if a node is a child of the parentNode if so don't add
    // it because we already have that data
    if (
      !(parentNode === null || !parentNode.contains(node)) ||
      // Ignore the dropdown that is created when you click the owl.
      node.id === "tag-menu"
    ) {
      return nextStep(parentNode, addedNodes, i + 1);
    }

    // The only supported DOM types that we care about are `DOM` (1) and
    // `text` (3).
    if (node.nodeType === Node.ELEMENT_NODE) {
      // In the case of a DOM type, check all the node's children for
      // input fields. Use this as a chance to restyle new inputs that
      // were not caught earlier.
      parentNode = node;
      bulkAdd({
        type: "dom",
        msg: node.outerHTML
      });
      if (
        node.outerHTML.includes("input") ||
        node.outerHTML.includes("textarea")
      ) {
        highlight.addClickToFill(node);
      }
      if (node.outerHTML.includes("form")) {
        const event = new CustomEvent("formAddedToDOM");
        window.dispatchEvent(event);
      }
    } else if (node.nodeType == Node.TEXT_NODE) {
      bulkAdd({
        type: "text",
        msg: node.textContent
      });
    }
  };

  const addedNodesHandler = addedNodes => nextStep(null, addedNodes);

  const nextStep = (parentNode, addedNodes, i = 0) => {
    if (i < addedNodes.length - 1) {
      window.requestAnimationFrame(() => {
        addedNodeHandler(parentNode, addedNodes, i);
      });
    }
  };

  const addedAttributesHandler = target => {
    // Ignore the screenshot class changes and the changes
    // to the style of the own dropdown.
    if (
      target.classList.contains("screenshot") ||
      target.classList.contains("screenshot-done") ||
      target.id === "tag-menu"
    ) {
      return;
    }
    bulkAdd({
      type: "dom",
      msg: target.outerHTML
    });
  };

  const addedCharacterDataHandler = target => {
    bulkAdd({
      type: "text",
      msg: target.nodeValue
    });
  };

  const mutationsHandler = mutations => {
    const handle = (i = 0) => {
      window.requestAnimationFrame(() => {
        const mutation = mutations[i];
        if (mutation.addedNodes.length > 0) {
          addedNodesHandler(mutation.addedNodes);
        } else {
          if (mutation.type == "attributes") {
            addedAttributesHandler(mutation.target);
          } else if (mutation.type == "characterData") {
            addedCharacterDataHandler(mutation.target);
          }
        }

        if (i < mutations.length - 1) {
          handle(i + 1);
        }
      });
    };
    handle();
  };

  // This observer will be used to observe changes in the DOM. It will batches
  // DOM changes and send them to the API/ server if it finds a tracer string.
  const observer = new MutationObserver(mutationsHandler);

  // The configuration for the observer. We want to pretty much watch for everything.
  const observerConfig = {
    attributes: true,
    childList: true,
    characterData: true,
    characterDataOldValue: true,
    subtree: true
  };

  const createBulkAdd = () => {
    let jobs = [];
    const sendAllJobs = () => {
      const copy = [...jobs];
      jobs = [];
      const send = chunk => {
        window.requestAnimationFrame(() => {
          try {
            util.send({
              "message-type": "bulk-jobs",
              location: document.location.href, //all these dom events are going to share the location
              msg: copy.splice(0, chunk)
            });
          } catch (e) {
            console.error("[ERROR]: failed to send batch DOM mutation job", e);
          }

          if (copy.length !== 0) {
            send(chunk);
          }
        });
      };

      send(10000);
    };

    return message => {
      if (jobs.length === 0) {
        setTimeout(sendAllJobs, 2000);
      }
      jobs.push(message);
    };
  };
  const bulkAdd = createBulkAdd();
  observer.observe(document.documentElement, observerConfig);
})();
