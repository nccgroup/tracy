const form = (() => {
  const addOnSubmit = elem => {
    const addEventListener = elem => {
      elem.addEventListener("submit", evt => {
        [...evt.target.getElementsByTagName("input")].map(t => {
          ({ str, tracers } = replace.str(t.value));
          t.value = str;
        });
      });
    };
    if (elem.tagName.toLowerCase() === "form") {
      addEventListener(elem);
    } else {
      [...elem.getElementsByTagName("form")].map(t => addEventListener(elem));
    }
  };

  return { addOnSubmit: addOnSubmit };
})();
