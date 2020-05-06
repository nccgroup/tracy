import { Strings } from "../shared/constants";
export const innerHTMLModInit = (rpc) => {
  // Get a reference to the original innerHTML prototype.
  const originalSet = Object.getOwnPropertyDescriptor(
    Element.prototype,
    Strings.INNER_HTML
  ).set;

  // Define a new prototype for innerHTML that proxies the call and then calls
  // the original innerHTML.
  Object.defineProperty(Element.prototype, Strings.INNER_HTML, {
    // Don't change this to an arrow function. It will change the `this` variable
    // to the one where we are defining this override and will break this functionality.
    set: function (value) {
      // Send a message to the extension to check the arguments of any
      // call to innerHTML have user-controlled input.
      if (value && value.length > 10) {
        rpc.addInnerHTMLJob(value, document.location.href);
      }
      //Call the original setter
      return originalSet.call(this, value);
    },
  });
};
