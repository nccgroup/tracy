(() => {
  const addedNodeHandler = (parentNode, addedNodes, i) => {
    const node = addedNodes[i];
    // Ignore scripts injected from the background page.
    if (
      node.src &&
      (node.src.startsWith(Strings.MOZ_EXT) ||
        node.src.startsWith(Strings.CHROME_EXT))
    ) {
      return nextStep(parentNode, addedNodes, i + 1);
    }
    // Check to see if a node is a child of the parentNode if so don't add
    // it because we already have that data
    if (
      !(parentNode === null || !parentNode.contains(node)) ||
      // Ignore the dropdown that is created when you click the owl.
      node.id === Strings.TAG_MENU
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
        type: Strings.DOM,
        msg: node.outerHTML,
      });
      if (
        node.outerHTML.includes(Strings.INPUT) ||
        node.outerHTML.includes(Strings.TEXT_AREA)
      ) {
        highlight.addClickToFill(node);
      }
      if (node.outerHTML.includes(Strings.FORM)) {
        const event = new CustomEvent(Strings.FormAddedToDOM);
        window.dispatchEvent(event);
      }
    } else if (node.nodeType == Node.TEXT_NODE) {
      bulkAdd({
        type: Strings.TEXT,
        msg: node.textContent,
      });
    }
  };

  const addedNodesHandler = (addedNodes) => nextStep(null, addedNodes);

  const nextStep = (parentNode, addedNodes, i = 0) => {
    if (i < addedNodes.length) {
      window.requestAnimationFrame(() => {
        addedNodeHandler(parentNode, addedNodes, i);
      });
    }
  };

  const addedAttributesHandler = (target) => {
    // Ignore the screenshot class changes and the changes
    // to the style of the own dropdown.
    if (
      target.classList.contains(Strings.SCREENSHOT) ||
      target.classList.contains(Strings.SCREENSHOT_DONE) ||
      target.id === Strings.TAG_MENU
    ) {
      return;
    }
    bulkAdd({
      type: Strings.DOM,
      msg: target.outerHTML,
    });
  };

  const addedCharacterDataHandler = (target) => {
    bulkAdd({
      type: Strings.TEXT,
      msg: target.nodeValue,
    });
  };

  const mutationsHandler = (mutations) => {
    const handle = (i = 0) => {
      window.requestAnimationFrame(() => {
        const mutation = mutations[i];
        if (mutation.addedNodes.length > 0) {
          addedNodesHandler(mutation.addedNodes);
        } else {
          if (mutation.type == Strings.ATTRIBUTES) {
            addedAttributesHandler(mutation.target);
          } else if (mutation.type == Strings.CHARACTER_DATA) {
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
  const createBulkAdd = () => {
    let jobs = [];
    const sendAllJobs = () => {
      const copy = [...jobs];
      jobs = [];
      const send = (chunk) => {
        window.requestAnimationFrame(() => {
          try {
            //all these dom events are going to share the location
            rpc.bulkJobs(document.location.href, copy.splice(0, chunk));
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

    return (message) => {
      if (jobs.length === 0) {
        setTimeout(sendAllJobs, 2000);
      }
      jobs.push(message);
    };
  };
  const bulkAdd = createBulkAdd();

  // This observer will be used to observe changes in the DOM. It will batches
  // DOM changes and send them to the API/ server if it finds a tracer string.
  const observer = new MutationObserver(mutationsHandler);

  // The configuration for the observer. We want to pretty much watch for everything.
  const observerConfig = {
    attributes: true,
    childList: true,
    characterData: true,
    characterDataOldValue: true,
    subtree: true,
  };

  observer.observe(document.documentElement, observerConfig);
})();
