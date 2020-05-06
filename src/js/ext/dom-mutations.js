import { EventTypes, Strings } from "../shared/constants";
import { highlight } from "./highlight";

export const domMutationsInit = (replace, rpc) => {
  const addDOMJob = (type, domWrite) => {
    if (domWrite && domWrite.length > 10) {
      const location = document.location.href;
      rpc.addDOMJob(domWrite, type, location);
    }
  };
  const h = highlight(replace, rpc);
  const addedNodeHandler = (donePromise, parentNode, addedNodes, i) => {
    const node = addedNodes[i];
    // Ignore scripts injected from the background page.
    if (
      node.src &&
      (node.src.startsWith(Strings.MOZ_EXT) ||
        node.src.startsWith(Strings.CHROME_EXT))
    ) {
      return nextStep(donePromise, parentNode, addedNodes, i + 1);
    }

    if (node.id && node.id == Strings.TAG_MENU) {
      return nextStep(donePromise, parentNode, addedNodes, i + 1);
    }
    // Check to see if a node is a child of the parentNode if so don't add
    // it because we already have that data
    if (parentNode !== null && parentNode.contains(node)) {
      return nextStep(donePromise, parentNode, addedNodes, i + 1);
    }

    // The only supported DOM types that we care about are `DOM` (1) and
    // `text` (3).
    if (node.nodeType === Node.ELEMENT_NODE) {
      // In the case of a DOM type, check all the node's children for
      // input fields. Use this as a chance to restyle new inputs that
      // were not caught earlier.
      addDOMJob(Strings.DOM, node.outerHTML);
      if (
        node.outerHTML.includes(Strings.INPUT) ||
        node.outerHTML.includes(Strings.TEXT_AREA)
      ) {
        h.addClickToFill(node);
      }
      if (node.outerHTML.includes(Strings.FORM)) {
        const event = new CustomEvent(EventTypes.FormAddedToDOM);
        window.dispatchEvent(event);
      }
    } else if (node.nodeType == Node.TEXT_NODE) {
      addDOMJob(Strings.TEXT, node.textContent);
    }

    return nextStep(donePromise, node, addedNodes, i + 1);
  };

  const addedNodesHandler = (donePromise, parentNode, addedNodes) =>
    nextStep(donePromise, parentNode, addedNodes);

  const nextStep = (donePromise, parentNode, addedNodes, i = 0) => {
    if (i < addedNodes.length) {
      window.requestAnimationFrame(() => {
        addedNodeHandler(donePromise, parentNode, addedNodes, i);
      });
    } else {
      donePromise(parentNode);
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
    addDOMJob(Strings.DOM, target.outerHTML);
  };

  const addedCharacterDataHandler = (target) =>
    addDOMJob(Strings.TEXT, target.nodeValue);

  const mutationsHandler = (mutations) => {
    const handle = (i = 0, parentNode = null) => {
      window.requestAnimationFrame(async () => {
        const mutation = mutations[i];
        if (mutation.addedNodes.length > 0) {
          parentNode = await new Promise((res) =>
            addedNodesHandler(res, parentNode, mutation.addedNodes)
          );
        } else {
          if (mutation.type == Strings.ATTRIBUTES) {
            addedAttributesHandler(mutation.target);
          } else if (mutation.type == Strings.CHARACTER_DATA) {
            addedCharacterDataHandler(mutation.target);
          }
        }

        if (i < mutations.length - 1) {
          handle(i + 1, parentNode);
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
    subtree: true,
  };

  observer.observe(document.documentElement, observerConfig);
};
