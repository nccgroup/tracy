import { Strings, SimulatedInputEvents } from "../shared/constants";
import { takeAndAddTracer } from "../shared/screenshot-client";

export const highlight = (replace, rpc) => {
  // Gets the element offset without jQuery.
  // http://stackoverflow.com/questions/18953144/how-do-i-get-the-offset-top-value-of-an-element-without-using-jquery
  const getElementOffset = (elem) => {
    const de = document.documentElement;
    const box = elem.getBoundingClientRect();
    const top = box.top + window.pageYOffset - de.clientTop;
    const left = box.left + window.pageXOffset - de.clientLeft;
    return { top, left };
  };

  // isNearRightEdge identifies if an event happened near the left edge of an element.
  const isNearRightEdge = (event) => {
    const elem = event.target;
    const offset = getElementOffset(elem);
    const rightEdge = elem.getBoundingClientRect().right - offset.left;
    const mouseClickPosition = event.pageX - offset.left;

    let buttonWidth = elem.getBoundingClientRect().width * 0.3;
    if (buttonWidth > 50) {
      buttonWidth = 50;
    }

    if (rightEdge - mouseClickPosition < buttonWidth) {
      return true;
    }

    return false;
  };

  const convertType = (type, event) => {
    switch (type) {
      case Strings.KEYBOARD:
        return new KeyboardEvent(event);
      case Strings.EVENT:
      default:
        return new Event(event);
    }
  };

  // Simulate input on a input field in hopes to trigger any input validation checks.
  const simulateInputType = async (elem, newValue) => {
    const oldValue = elem.value;
    elem.focus();
    elem.value = newValue;

    await rpc.simulateReactValueTracker(
      newValue,
      oldValue,
      elem.nodeName,
      elem.id,
      elem.name
    );

    return SimulatedInputEvents.map(({ event, type }) =>
      elem.dispatchEvent(convertType(type, event))
    );
  };

  // registerRightClickHandler catches a click near the right end of an input field
  // to get a list of tracer strings.
  const rightSideInputHandler = async (e) => {
    if (!isNearRightEdge(e)) {
      return;
    }
    e.stopPropagation();
    let elem = e.target;
    if (e.target.id) {
      elem = document.getElementById(e.target.id);
    }
    const tagMenu = document.createElement(Strings.DIV);
    tagMenu.addEventListener(
      Strings.MOUSEDOWN,
      (_) => {
        tagMenu.parentNode.removeChild(tagMenu);
      },
      { once: true, passive: true }
    );
    const list = document.createElement(Strings.UL);
    tagMenu.id = Strings.TAG_MENU;
    tagMenu.appendChild(list);

    // Create the list of tracers types they can choose from. Dynamically
    // create them so we can easily add new types of tracer types.
    replace.getTracerPayloads().map((t) => {
      const listElement = document.createElement(Strings.LI);
      listElement.addEventListener(Strings.MOUSEDOWN, (_) => {
        fillElement(elem, t);
      });
      listElement.classList.add(Strings.HIGHLIGHT_ON_HOVER);
      listElement.innerText = t[0];
      list.appendChild(listElement);
    });

    // Insert into root of DOM so nothing can mess it up now, but
    // position it relative to where the event happened.
    document.body.appendChild(tagMenu);
    tagMenu.style.left = e.pageX + Strings.PX;
    tagMenu.style.top = e.pageY + Strings.PX;

    document.addEventListener(
      Strings.MOUSEDOWN,
      (_) =>
        tagMenu.parentNode !== null
          ? tagMenu.parentNode.removeChild(tagMenu)
          : true,
      { once: true, passive: true }
    );
  };

  // fillElement takes a tracy string and either generates a payload
  // if it starts with "gen" and adds the resultant tracer to the input
  // element specified.
  const fillElement = async (elem, tracer) => {
    if (!tracer[0].toLowerCase().startsWith(Strings.GEN)) {
      return await fillNonGenPayload(elem, tracer[0]);
    } else {
      return await fillGenPayload(elem, tracer[0]);
    }
  };

  // fillGenPayload generates a payload on-the-fly using the
  // tracer API and inserts it into the element. It will also
  // take a screenshot of the surrounding area and attack that to the tracer.
  const fillGenPayload = async (elem, tracerString) => {
    const { tracers, str } = replace.str(tracerString);
    const tracer = tracers.pop();
    simulateInputType(elem, elem.value + str);
    await takeAndAddTracer(rpc, elem, tracer);
  };

  // fillNonGenPayload handles the logic for when filling an HTML element
  // with a payload that is not generated on-the-fly.
  const fillNonGenPayload = async (elem, tracerString) =>
    await simulateInputType(elem, elem.value + tracerString);

  // Find all the inputs and style them with the extension.
  // autom indicates if the user wants to fill the page without
  // modifying their settings.
  const addClickToFill = async (elem) =>
    [
      ...elem.getElementsByTagName(Strings.INPUT),
      ...elem.getElementsByTagName(Strings.TEXT_AREA),
    ]
      .filter(
        (tag) =>
          [Strings.TEXT, Strings.URL, Strings.SEARCH].includes(tag.type) ||
          tag.nodeName.toLowerCase() == Strings.TEXT_AREA
      )
      // Register event listeners for all types of elements we'd like to allow for a
      // tracer.
      .map((t) => t.addEventListener(Strings.MOUSEDOWN, rightSideInputHandler));
  return { addClickToFill };
};
