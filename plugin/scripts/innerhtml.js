(function() {
  // Get a reference to the original innerHTML prototype.
  const originalSet = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "innerHTML"
  ).set;

  // Define a new prototype for innerHTML that proxies the call and then calls
  // the original innerHTML.
  Object.defineProperty(Element.prototype, "innerHTML", {
    set: function(value) {
      // Send a message to the extension to check the arguments of any
      // call to innerHTML have user-controlled input.
      window.postMessage(
        {
          "message-type": "job",
          type: "innerHTML",
          msg: value,
          location: document.location.href
        },
        "*"
      );

      //Call the original setter
      return originalSet.call(this, value);
    }
  });
})();
