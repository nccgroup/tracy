// Gets the element offset without jQuery.
// http://stackoverflow.com/questions/18953144/how-do-i-get-the-offset-top-value-of-an-element-without-using-jquery
function getElementOffset(element) {
  const de = document.documentElement;
  const box = element.getBoundingClientRect();
  const top = box.top + window.pageYOffset - de.clientTop;
  const left = box.left + window.pageXOffset - de.clientLeft;
  return { top: top, left: left };
}

// Function to help identify if an event happened near the left edge of an element.
function isNearLeftEdge(element, event) {
  let ret = false;
  const offset = getElementOffset(element);
  const rightEdge = element.getBoundingClientRect().right - offset.left;
  const mouseClickPosition = event.pageX - offset.left;
  let buttonWidth = element.getBoundingClientRect().width * 0.3;

  if (buttonWidth > 50) {
    buttonWidth = 50;
  }

  if (rightEdge - mouseClickPosition < buttonWidth) {
    ret = true;
  }

  return ret;
}

// Simulate input on a input field in hopes to trigger any input validation checks.
function simulateKeyPress(e, value) {
  e.focus();
  e.value = value;
  ["keypress", "keyup", "keydown"].forEach(eventName => {
    var event = new KeyboardEvent(eventName);
    e.dispatchEvent(event);
  });

  e.dispatchEvent(new Event("change"));
}

// registerLongPauseHandler catches a long click near the end of an input field
// to get a list of tracer strings.
function registerLongPauseHandler(e) {
  if (!isNearLeftEdge(e.target, e)) {
    return;
  }
  // This timer is used to check for a long press.
  const tagMenu = document.createElement("div");
  tagMenu.id = "tag-menu";
  const list = document.createElement("ul");
  tagMenu.appendChild(list);

  // Create the list of tracers types they can choose from. Dynamically
  // create them so we can easily add new types of tracer types.
  chrome.runtime.sendMessage(
    {
      "message-type": "config",
      config: "tracer-string-types"
    },
    tracerStringTypes => {
      for (let tracerStringTypeKey in tracerStringTypes) {
        const listElement = document.createElement("li");
        listElement.addEventListener("mousedown", el => {
          mouseDownEventListener(e, el, tagMenu);
        });
        listElement.classList.add("highlight-on-hover");
        listElement.innerText = tracerStringTypes[tracerStringTypeKey];
        list.appendChild(listElement);
      }

      //insert into root of DOM so nothing can mess it up now
      document.documentElement.appendChild(tagMenu);

      tagMenu.style.left = e.pageX + "px";
      tagMenu.style.top = e.pageY + "px";
    }
  );
}

// mouseDownEventListener handles the moust clicks when a users clicks a long
// click near the edge of an input field.
function mouseDownEventListener(e, el, tagMenu) {
  if (!el.target.innerText.toLowerCase().startsWith("gen")) {
    // Add the tracer string template.
    simulateKeyPress(e.target, e.target.value + el.currentTarget.innerText);
    return;
  }

  chrome.storage.local.get({ restHost: "localhost", restPort: 8081 }, res => {
    const req = new Request(
      `http://${res.restHost}:${res.restPort}/tracers/generate?tracer_string=${
        el.target.innerText
      }&url=${document.location}`,
      {
        headers: {
          Hoot: "!",
          "X-TRACY": "NOTOUCHY"
        }
      }
    );

    fetch(req)
      .then(res => res.json())
      .then(res => {
        // Add the tracer string template.
        simulateKeyPress(
          e.target,
          e.target.value + res.Tracers[0].TracerPayload
        );
      })
      .catch(err => console.error(err));
  });
}

// on mouseUp listener on whole window to capture all mouse up events.
document.addEventListener("mousedown", e => {
  const menuElement = document.getElementById("tag-menu");

  if (menuElement != null) {
    menuElement.parentNode.removeChild(menuElement);
  }
});

// Find all the inputs and style them with the extension.
function clickToFill(element) {
  const inputs = [
    ...element.getElementsByTagName("input"),
    ...element.getElementsByTagName("textarea")
  ].filter(tag => {
    return (
      ["text", "url", "search"].includes(tag.type) ||
      tag.nodeName.toLowerCase() == "textarea"
    );
  });

  // Register event listeners for all types of elements we'd like to allow for a
  // tracer.
  inputs.map(t => t.addEventListener("mousedown", registerLongPauseHandler));
}
