const highlight = (() => {
  // Gets the element offset without jQuery.
  // http://stackoverflow.com/questions/18953144/how-do-i-get-the-offset-top-value-of-an-element-without-using-jquery
  const getElementOffset = elem => {
    const de = document.documentElement;
    const box = elem.getBoundingClientRect();
    const top = box.top + window.pageYOffset - de.clientTop;
    const left = box.left + window.pageXOffset - de.clientLeft;
    return { top: top, left: left };
  };

  // isNearRightEdge identifies if an event happened near the left edge of an element.
  const isNearRightEdge = (elem, event) => {
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

  // Simulate input on a input field in hopes to trigger any input validation checks.
  const simulateInputType = async (elem, value) => {
    elem.focus();
    elem.value = value;

    // TODO: for some websits, this doesn't seem to work. Might need to add
    // new event types. Add them here.
    return await Promise.all(
      [
        { type: "keyboard", event: "keypress" },
        { type: "keyboard", event: "keyup" },
        { type: "keyboard", event: "keydown" },
        { type: "event", event: "change" }
      ].map(async e => {
        let event;
        switch (e.type) {
          case "keyboard":
            event = new KeyboardEvent(e.event);
            break;
          case "event":
            event = new Event(e.event);
            break;
        }

        elem.dispatchEvent(event);
        return true;
      })
    );
  };

  // registerRightClickHandler catches a click near the right end of an input field
  // to get a list of tracer strings.
  const rightSideInputHandler = async e => {
    if (!isNearRightEdge(e.target, e)) {
      return;
    }
    e.stopPropagation();
    const tagMenu = document.createElement("div");
    tagMenu.addEventListener(
      "mousedown",
      _ => {
        tagMenu.parentNode.removeChild(tagMenu);
      },
      { once: true, passive: true }
    );
    const list = document.createElement("ul");
    tagMenu.id = "tag-menu";
    tagMenu.appendChild(list);

    // Create the list of tracers types they can choose from. Dynamically
    // create them so we can easily add new types of tracer types.
    replace.getTracerPayloads().map(t => {
      const listElement = document.createElement("li");
      listElement.addEventListener("mousedown", _ => {
        fillElement(e.target, t);
      });
      listElement.classList.add("highlight-on-hover");
      listElement.innerText = t[0];
      list.appendChild(listElement);
    });

    // Insert into root of DOM so nothing can mess it up now, but
    // position it relative to where the event happened.
    document.documentElement.appendChild(tagMenu);
    tagMenu.style.left = e.pageX + "px";
    tagMenu.style.top = e.pageY + "px";
  };

  // captureSceenshot sends a command to the background page
  // take a screenshot given the dimensions specified by the
  // frame element of the target passed in. padding is the amount
  // of space on each side of the element
  const captureScreenshot = async (e, padding = 0) => {
    e.classList.add(Strings.SCREENSHOT);
    const dURIp = channel.send(MessageTypes.Screenshot);
    const rec = document.body.getBoundingClientRect();
    const dim = {
      top: rec.top - padding,
      left: rec.left - padding,
      width: rec.width + 2 * padding,
      height: window.innerHeight + 2 * padding, // I think
      ratio: 1
    };
    const { dURI } = await dURIp;
    const imgP = dataURIToImage(dURI, dim);
    e.classList.add(Strings.SCREENSHOT_DONE);
    e.classList.remove(Strings.SCREENSHOT);
    return await imgP;
  };

  // fillElement takes a tracy string and either generates a payload
  // if it starts with "gen" and adds the resultant tracer to the input
  // element specified.
  const fillElement = async (elem, tracer) => {
    if (!tracer[0].toLowerCase().startsWith("gen")) {
      return await fillNonGenPayload(elem, tracer[0]);
    } else {
      return await fillGenPayload(elem, tracer[0]);
    }
  };

  // fillGenPayload generates a payload on-the-fly using the
  // tracer API and inserts it into the element. It will also
  // take a screenshot of the surrounding area and attack that to the tracer.
  const fillGenPayload = async (elem, tracerString) => {
    const r = replace.str(tracerString);
    const tracer = r.tracers.pop();
    simulateInputType(elem, elem.value + r.str);
    tracer.Screenshot = await captureScreenshot(elem);
    // When creating a tracer, make sure the Requests attribute is there.
    tracer.Requests = [];
    tracer.Severity = 0;
    tracer.HasTracerEvents = false;
    channel.send({ tracer, ...MessageTypes.AddTracer });
  };

  // fillNonGenPayload handles the logic for when filling an HTML element
  // with a payload that is not generated on-the-fly.
  const fillNonGenPayload = async (elem, tracerString) =>
    await simulateInputType(elem, elem.value + tracerString);

  // Given an data URI and dimensions, create an Image and use the canvas
  // to draw the image.
  const dataURIToImage = (dURI, dim) => {
    return new Promise(res => {
      const canvas = document.createElement("canvas");
      const img = new Image();
      const context = canvas.getContext("2d");

      img.onload = () => {
        canvas.width = dim.width;
        canvas.height = dim.height;
        context.drawImage(
          img,
          dim.left,
          dim.top,
          dim.width * dim.ratio,
          dim.height * dim.ratio,
          0,
          0,
          dim.width,
          dim.height
        );

        res(canvas.toDataURL());
      };
      img.src = dURI;
    });
  };

  // Find all the inputs and style them with the extension.
  // autom indicates if the user wants to fill the page without
  // modifying their settings.
  const addClickToFill = async elem =>
    [
      ...elem.getElementsByTagName("input"),
      ...elem.getElementsByTagName("textarea")
    ]
      .filter(
        tag =>
          ["text", "url", "search"].includes(tag.type) ||
          tag.nodeName.toLowerCase() == "textarea"
      )
      // Register event listeners for all types of elements we'd like to allow for a
      // tracer.
      .map(t => t.addEventListener("mousedown", rightSideInputHandler));

  document.addEventListener("mousedown", _ => {
    const menuElement = document.getElementById("tag-menu");

    if (menuElement != null) {
      menuElement.parentNode.removeChild(menuElement);
    }
  });
  return { addClickToFill: addClickToFill };
})();
