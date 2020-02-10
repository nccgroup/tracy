const form = (() => {
  // captureSceenshot sends a command to the background page
  // take a screenshot given the dimensions specified by the
  // frame element of the target passed in. padding is the amount
  // of space on each side of the element
  const screenshotHandler = resolve => {
    return e => {
      if (e.data && e.data["message-type"] !== "screenshot-done") {
        return;
      }
      resolve(e.data.dURI);
    };
  };
  async function captureScreenshot(e, padding = 0) {
    e.classList.add("screenshot");

    let handler;
    const dURIp = new Promise(r => {
      handler = screenshotHandler(r);
      window.addEventListener("message", handler);
      window.postMessage({ "message-type": "screenshot" }, "*");
    });

    const rec = document.body.getBoundingClientRect();
    const dim = {
      top: rec.top - padding,
      left: rec.left - padding,
      width: rec.width + 2 * padding,
      height: window.innerHeight + 2 * padding, // I think
      ratio: 1
    };
    const dURI = await dURIp;
    window.removeEventListener("message", handler);
    const imgP = dataURIToImage(dURI, dim);
    e.classList.add("screenshot-done");
    e.classList.remove("screenshot");
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

  const replaceFormInputs = form => {
    const formID = form.ID;
    // First, get all input elements under the form.
    const tracersa = [...form.getElementsByTagName("input")]
      .concat(
        // Textareas are also considered input to forms.
        [...form.getElementsByTagName("textarea")]
      )
      // Need to look for elements that would be submitted using the form
      // attribute.
      .concat(
        [...document.getElementsByTagName("input")].filter(
          t => t.form === formID
        )
      )
      // Textareas also get submitted.
      .concat(
        [...document.getElementsByTagName("textarea")].filter(
          t => t.form === formID
        )
      )
      .map(t => {
        const b = replace.str(t.value);
        if (b.tracers.length > 0) {
          t.value = b.str;
          return b.tracers;
        }
        return [];
      })
      .flat();

    // If any tracers were added to this form, send API request to log them.
    tracersa.map(async t => {
      const ss = await captureScreenshot(form);
      // When creating a tracer, make sure the Requests attribute is there.
      t.Requests = [];
      t.OverallSeverity = 0;
      t.HasTracerEvents = false;
      t.Screenshot = ss;
      window.postMessage({
        "message-type": "database",
        query: "addTracer",
        tracer: t
      });
    });
  };
  const addEventListener = elem => {
    elem.addEventListener("submit", evt => {
      // If the form isn't submitting, we shouldn't really do anything.
      // If this state changes and the form becomes like a normal form again,
      // and the user hit submit again,
      // we can collect tracers, but I can't think of a case where the form was
      // defaultPrevented and we still needed to collect tracers from the form.
      // Also, since we are the last form onsubmit handler to register, we should
      // be the last to execute. I don't think there would ever be a way for another event
      // handler to change this state while this handler was executing.
      if (evt.target.defaultPrevented) return;
      replaceFormInputs(evt.target);
    });

    return elem;
  };

  window.addEventListener("message", e => {
    if (
      e.data &&
      (e.data["message-type"] !== "dom" || e.data.type !== "form")
    ) {
      return;
    }

    // Since we can't pass the exact DOM node from the mutation observer,
    // take the forms we have already proxied with a custom class.
    [...document.getElementsByTagName("form")]
      .filter(f => !f.classList.contains("tracy-form-mod"))
      .map(f => addEventListener(f))
      .map(f => {
        f.classList.add("tracy-form-mod");
        return f;
      })
      .map(f => {
        console.log("setting proxy on form");
        f.submit = new Proxy(f.submit, {
          apply: (t, thisa, al) => {
            console.log(t);
            replaceFormInputs(f);
            Reflect.apply(t, thisa, al);
          }
        });
      });
  });
})();
