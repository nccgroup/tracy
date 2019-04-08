const form = (() => {
  const addOnSubmit = elem => {
    const addEventListener = elem => {
      elem.addEventListener("submit", evt => {
        let tracersa = [];
        [...evt.target.getElementsByTagName("input")].map(t => {
          const b = replace.str(t.value);
          if (b.tracers.length > 0) {
            t.value = b.str;
            tracersa = tracersa.concat(b.tracers);
          }
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
              RequestMethod: evt.target.getAttribute("method") || "GET",
              Tracers: tracersa
            })
          });
        }
      });
    };
    if (elem.tagName.toLowerCase() === "form") {
      addEventListener(elem);
    } else {
      [...elem.getElementsByTagName("form")].map(t => addEventListener(t));
    }
  };

  // buildRequestFromForm transforms an HTML form object into a string
  // of the expected HTTP request it will generate.
  const buildRequestFromForm = form => {
    const method = form.getAttribute("method") || "GET";
    const url = form.getAttribute("action") || document.location.href;
    const host = url.startsWith("http")
      ? new URL(url).host
      : document.location.host;

    const enctype =
      form.getAttribute("enctype") || "application/x-www-form-urlencoded";

    const body = [...form.getElementsByTagName("input")]
      .map(t => `${encodeURIComponent(t.name)}=${encodeURIComponent(t.value)}`)
      .join("&");
    if (method.toLowerCase() === "get" || method.toLowerCase() === "head") {
      return `${method} ${url}?${body} HTTP/1.1
Host: ${host}
Content-Type: ${enctype}`;
    }

    return `${method} ${url} HTTP/1.1
Host: ${host}
Content-Type: ${enctype}

${body}`;
  };

  return { addOnSubmit: addOnSubmit };
})();
