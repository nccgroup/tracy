const form = (() => {
  const addOnSubmit = elem => {
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
        let tracersa = [];
        const formID = evt.target.ID;
        // First, get all input elements under the form.
        const params = [...evt.target.getElementsByTagName("input")]
          .concat(
            // Textareas are also considered input to forms.
            [...evt.target.getElementsByTagName("textarea")]
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
              tracersa = tracersa.concat(b.tracers);
            }
            return t;
          });

        // If any tracers were added to this form, send API request to log them.
        if (tracersa.length > 0) {
          tracersa.map(t =>
            util.send({
              "message-type": "background-fetch",
              route: "/api/tracy/tracers/requests",
              method: "POST",
              body: JSON.stringify(t)
            })
          );
        }
      });
    };

    if (elem.tagName.toLowerCase() === "form") {
      addEventListener(elem);
    } else {
      [...elem.getElementsByTagName("form")].map(t => addEventListener(t));
    }
  };

  return { addOnSubmit: addOnSubmit };
})();
