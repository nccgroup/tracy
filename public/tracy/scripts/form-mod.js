const form = (() => {
  // captureSceenshot sends a command to the background page
  // take a screenshot given the dimensions specified by the
  // frame element of the target passed in. padding is the amount
  // of space on each side of the element
  async function captureScreenshot(e, padding = 0) {
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
  }
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

  const inputStr = "input";
  const replaceFormInputs = form =>
    // Turns out we can use this nice API to get all the data that wouldn't normally
    // get submitted with a form.
    [...new FormData(form)]
      .map(([nameAttr, value]) => {
        const { tracers, str } = replace.str(value);
        if (tracers.length <= 0) {
          return [];
        }

        // If there was tracers in the input value, find the input element
        // associated with that name and replace it's value. This probably
        // won't work for all elements, TODO: should find alternate ways of grabbing the element
        const elems = document.getElementsByName(nameAttr);
        if (
          elems.length !== 1 &&
          elems[0].nodeName.toLowerCase() !== inputStr
        ) {
          // There shouldn't be more than one input element who's name is this
          console.error("Couldn't find the element to replace!");
          return [];
        }
        elems[0].value = str;
        return tracers;
      })
      .flat();

  const storeTracers = (tracers, ss = null) => {
    tracers.map(t => {
      // When creating a tracer, make sure the Requests attribute is there.
      t.Requests = [];
      t.Severity = 0;
      t.HasTracerEvents = false;
      t.Screenshot = ss;

      const event = new CustomEvent("tracyMessage", {
        detail: {
          "message-type": "database",
          query: "addTracer",
          tracer: t
        }
      });
      window.dispatchEvent(event);
    });
  };

  const formSubmitListener = evt => {
    const tracers = replaceFormInputs(evt.target);
    if (tracers.length === 0) {
      return;
    }
    evt.preventDefault();
    // Ideally, we'd like to take a screenshot here, but its a little tricky.
    // 1.) If we try to take a screenshot now, it won't finish in time before the
    //     form is submitted because capturing a screenshot is asynchronouns the
    //     form submission won't wait for it.
    // 2.) We can prevent default the behavior of the form, then submit the form
    //     using .submit(), but.submit() is different than clicking the submit button
    //     any in some applications won't submit all the fields (those with type=submit,
    //     in cases where there are multiple buttons to submit a form, this field is sent as a POST body
    //     argument to indicate which button was clicked)
    // 3.) We double submit the form, capturing the screenshot the first round, then doing
    //     the button click again. This would cause issues with double doing all the onsubmit
    //     event listeners in the page.

    // #2 is the best option, but we just need to remove the type=submit from button
    // that submitted the forms so that it will get sent as a regular POST body
    // parameter. This button is found in evt.explictOriginalTarget. Creat of copy
    // of this element minus the type=submit and embed it into the form. We also
    // want make sure its hidden so it doesn't look funky.
    if (evt.explicitOriginalTarget) {
      const i = document.createElement("input");
      [...evt.explicitOriginalTarget.attributes]
        .filter(a => a.nodeName !== "type" && a.value !== "submit")
        .map(a => i.setAttribute(a.nodeName, a.value));
      i.setAttribute("type", "hidden");
      evt.target.appendChild(i);
    }
    captureScreenshot(evt.currentTarget).then(ss => {
      storeTracers(tracers, ss);
      evt.target.submit();
    });
  };

  const formAddedToDOM = () => {
    // Since we can't pass the exact DOM node from the mutation observer,
    // take the forms we have already proxied with a custom class.
    [...document.getElementsByTagName("form")]
      .filter(f => !f.classList.contains("tracy-form-mod"))
      .map(f => {
        f.addEventListener("submit", formSubmitListener);
        return f;
      })
      .map(f => {
        f.classList.add("tracy-form-mod");
        return f;
      })
      .map(f => {
        // We need to proxy the submit function call because the submit
        // function call doesn't trigger submit events and therefor
        // our handler code won't get called
        const submitProxy = {
          apply: (t, thisa, al) => {
            // Since we are submitting the form with JavaScript, remove the onsubmit handler
            // for this form. It is only used for regular form submissions.
            f.removeEventListener("submit", replaceFormInputs);

            // Replace the tracers, and since we are not in an onsubmit handler
            // we can wait for the screen capture to finish and then submit the form.
            const tracers = replaceFormInputs(f);
            if (tracers.length === 0) {
              Reflect.apply(t, thisa, al);
              return;
            }
            // If there were tracers that were swapped out, take a screenshot.
            captureScreenshot(f).then(ss => {
              storeTracers(tracers, ss);
              Reflect.apply(t, thisa, al);
            });

            return tracers;
          }
        };
        f.submit = new Proxy(f.submit, submitProxy);
        // mainly adding this for testing purposes so tests have access to any
        // tracers returned from this function
        f.requestSubmit = new Proxy(f.requestSubmit, submitProxy);
        return f;
      })
      .map(f => {
        f.addEventListener = new Proxy(f.addEventListener, {
          apply: (t, thisa, al) => {
            // If the page adds a submit listener, we need to move our
            // listeners back to the bottom of the bubbling so that
            // we can ensure we are the last submit handler to be called
            if (al[0] === "submit") {
              f.removeEventListener("submit", formSubmitListener);
              Reflect.apply(t, thisa, al);
              Reflect.apply(t, thisa, [al[0], formSubmitListener, al[2]]);
            }
          }
        });
      });
  };
  formAddedToDOM();
  window.addEventListener("formAddedToDOM", _ => {
    formAddedToDOM();
  });
})();
