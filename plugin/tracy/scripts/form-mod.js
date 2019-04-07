const form = (() => {
  const addOnSubmit = elem => {
    const addEventListener = elem => {
      elem.addEventListener("submit", evt => {
        let tracersa = [];
        [...evt.target.getElementsByTagName("input")].map(t => {
          const b = replace.str(t.value);
          t.value = b.str;
          tracersa = tracersa.concat(b.tracers);
        });

        // If any tracers were added to this form, send API request to log them.
        if (tracersa.length > 0) {
          util.send({
            "message-type": "background-fetch",
            route: "/api/tracy/tracers",
            method: "POST",
            body: JSON.stringify({
              RawRequest: buildRequestFromForm(evt.target),
              RequestURL: document.location.href,
              RequestMethod: evt.target.getAttribute("method"),
              Tracers: tracersa
            })
          });
        }
      });
    };
    if (elem.tagName.toLowerCase() === "form") {
      addEventListener(elem);
    } else {
      [...elem.getElementsByTagName("form")].map(t => addEventListener(elem));
    }
  };

  // buildRequestFromForm transforms an HTML form object into a string
  // of the expected HTTP request it will generate.
  const buildRequestFromForm = form => {
    const method = form.getAttribute("method");
    const url = form.getAttribute("action");
    //TODO: not sure how to get this from a form. Not sure it really matters.
    const version = "HTTP/1.1";
    const host = url.startsWith("http")
      ? new URL(url).host
      : document.location.host;

    const enctype = form.getAttribute("enctype")
      ? form.getAttribute("enctype")
      : "application/x-www-form-urlencoded";
    const body = [...form.getElementsByTagName("input")]
      .map(t => `${t.name}=${t.value}`)
      .join("&");
    return `${method} ${url} ${version}
Host: ${host}
Content-Type: ${enctype}

${body}`;
  };

  return { addOnSubmit: addOnSubmit };
})();
