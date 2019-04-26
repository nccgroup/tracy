const highlight = (() => {
  // Gets the element offset without jQuery.
  // http://stackoverflow.com/questions/18953144/how-do-i-get-the-offset-top-value-of-an-element-without-using-jquery
  function getElementOffset(elem) {
    const de = document.documentElement;
    const box = elem.getBoundingClientRect();
    const top = box.top + window.pageYOffset - de.clientTop;
    const left = box.left + window.pageXOffset - de.clientLeft;
    return { top: top, left: left };
  }

  // isNearLeftEdge identifies if an event happened near the left edge of an element.
  function isNearLeftEdge(elem, event) {
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
  }

  // Simulate input on a input field in hopes to trigger any input validation checks.
  async function simulateInputType(elem, value) {
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
  }

  // registerRightClickHandler catches a click near the right end of an input field
  // to get a list of tracer strings.
  async function rightSideInputHandler(e) {
    // Remember the click event so that the background can tell us if they
    // used a context menu item and which one is was.
    cache.set(e.target);

    if (!isNearLeftEdge(e.target, e)) {
      return;
    }

    // This timer is used to check for a long press.
    const tagMenu = document.createElement("div");
    const list = document.createElement("ul");
    tagMenu.id = "tag-menu";
    tagMenu.appendChild(list);

    // Create the list of tracers types they can choose from. Dynamically
    // create them so we can easily add new types of tracer types.
    const types = await util.send({
      "message-type": "config",
      config: "tracer-string-types"
    });

    types.map(t => {
      const listElement = document.createElement("li");
      listElement.addEventListener("mousedown", el => {
        fillElement(e.target, el.target.innerText);
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
  }

  // captureSceenshot sends a command to the background page
  // take a screenshot given the dimensions specified by the
  // parent element of the target passed in. padding is the amount
  // of space on each side of the element
  async function captureScreenshot(e, padding) {
    e.classList.add("screenshot");
    const dURIp = util.send({ "message-type": "screenshot" });
    const rec = e.getBoundingClientRect();
    const dim = {
      top: rec.top - padding,
      left: rec.left - padding,
      width: rec.width + 2 * padding,
      height: rec.height + 2 * padding,
      ratio: 1
    };
    const dURI = await dURIp;
    const imgP = dataURIToImage(dURI, dim);
    e.classList.add("screenshot-done");
    e.classList.remove("screenshot");
    return await imgP;
  }

  // clickCache is an object that can be used to set and get
  // the last clicked item without having to store it in a
  // global variable. clickCache has two functions, get and set.
  // set takes an HTML element and sets the cache. get returns
  // the value of the cache.
  function clickCache() {
    let lastClicked;
    return {
      get: () => {
        return lastClicked;
      },
      set: e => {
        lastClicked = e;
      }
    };
  }

  // fillElement takes a tracy string and either generates a payload
  // if it starts with "gen" and adds the resultant tracer to the input
  // element specified.
  async function fillElement(elem, tracerString) {
    if (!elem) {
      console.error("no element to set the tracer string was defined");
      return false;
    }

    if (!tracerString.toLowerCase().startsWith("gen")) {
      return await fillNonGenPayload(elem, tracerString);
    } else {
      return await fillGenPayload(elem, tracerString);
    }
  }

  // fillGenPayload generates a payload on-the-fly using the
  // tracer API and inserts it into the element. It will also
  // take a screenshot of the surrounding area and attack that to the tracer.
  async function fillGenPayload(elem, tracerString) {
    const r = replace.str(tracerString);
    simulateInputType(elem, elem.value + r.str);
    r.tracers[0].Screenshot = await captureScreenshot(elem, 200);
    r.tracers[0].Requests = [
      {
        RawRequest: "GENERATED",
        RequestMethod: "GENERATED",
        RequestURL: document.location.href
      }
    ];
    util.send({
      "message-type": "background-fetch",
      route: "/api/tracy/tracers",
      method: "POST",
      body: JSON.stringify(r.tracers[0])
    });
  }

  // fillNonGenPayload handles the logic for when filling an HTML element
  // with a payload that is not generated on-the-fly.
  async function fillNonGenPayload(elem, tracerString) {
    // TODO: right now, there is no way to do screenshots of non-gen payloads
    // because we don't know what tracer to associate the screenshot with
    // until the network request is made.
    return await simulateInputType(elem, elem.value + tracerString);
  }

  // Given an data URI and dimensions, create an Image and use the canvas
  // to draw the image.
  function dataURIToImage(dURI, dim) {
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
  }

  // Find all the inputs and style them with the extension.
  // autom indicates if the user wants to fill the page without
  // modifying their settings.
  async function addClickToFill(elem, autom) {
    const autop = util.get({ autoFill: false, autoFillPayload: "zzXSSzz" });
    const ifs = [
      ...elem.getElementsByTagName("input"),
      ...elem.getElementsByTagName("textarea")
    ].filter(
      tag =>
        ["text", "url", "search"].includes(tag.type) ||
        tag.nodeName.toLowerCase() == "textarea"
    );

    // Register event listeners for all types of elements we'd like to allow for a
    // tracer.
    ifs.map(t => t.addEventListener("mousedown", rightSideInputHandler));
    const auto = await autop;
    // If the user configured the plugin to autofill inputs, do that here.
    if (!auto.autoFill && !autom) {
      return true;
    }

    ifs.map(t => fillElement(t, auto.autoFillPayload));
    return true;
  }

  // on mouseUp listener on whole window to capture all mouse up events.
  document.addEventListener("mousedown", e => {
    const menuElement = document.getElementById("tag-menu");

    if (menuElement != null) {
      menuElement.parentNode.removeChild(menuElement);
    }
  });

  // instantiate our click cache.
  const cache = clickCache();

  // Event listener from the background thread when a user clicks one
  // of the context menus.
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.cmd == "clickCache") {
      fillElement(cache.get(), msg.tracerString);
    }
  });

  // Event listener from the background thread when a user clicks
  // the auto-fill context menu.
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.cmd == "auto-fill") {
      clickToFill(document, true);
    }
  });

  return { addClickToFill: addClickToFill };
})();
