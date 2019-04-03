const form = (() => {
  const addOnSubmit = elem => {
    [...elem.getElementsByTagName("form")].map(t =>
      t.addEventListener("submit", addOnSubmit)
    );
    const form = event.target;
    [...form.getElementsByTagName("input")].map(i => {
      alert("Event listener!");
      //modChild(children[j]);
    });
  };

  const replaceOnSubmit = form => {
    console.log("[ONSUBMIT]", onsubmit);
    forms[i].setAttribute("onsubmit", `(function(){${onsubmit}})()`);
    onsubmit = forms[i].getAttribute("onsubmit");
    console.log("[ONSUBMIT-CHANGED]", onsubmit);
  };
  return { addOnSubmit: addOnSubmit };
})();
