(() => {
  // Get a reference to the original innerHTML prototype.
  const originalSet = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "innerHTML"
  ).set;

  // Define a new prototype for innerHTML that proxies the call and then calls
  // the original innerHTML.
  Object.defineProperty(Element.prototype, "innerHTML", {
    // Don't change this to an arrow function. It will change the `this` variable
    // to the one where we are defining this override and will break this functionality.
    set: function(value) {
      // Send a message to the extension to check the arguments of any
      // call to innerHTML have user-controlled input.
      const event = new CustomEvent("tracyMessage", {
        detail: {
          "message-type": "job",
          type: "innerHTML",
          msg: value,
          extras: { stack: new Error().stack },
          location: document.location.href
        }
      });
      window.dispatchEvent(event);

      //Call the original setter
      return originalSet.call(this, value);
    }
  });
})();
