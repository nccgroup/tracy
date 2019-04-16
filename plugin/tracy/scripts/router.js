(() => {
  // Routes messages from the extension to various functions on the background.
  const messageRouter = (message, sender, sendResponse) => {
    if (message["message-type"]) {
      switch (message["message-type"]) {
        case "job":
          jobs.add(message, sender, sendResponse);
          break;
        case "config":
          settings.query(message, sender, sendResponse);
          break;
        case "background-fetch":
          background.fetch(message, sender, sendResponse);
          return true;
        case "screenshot":
          screenshot.take(message, sender, sendResponse);
          return true;
      }
    } /*else if (message.r) {
      // Changed the format of the message so we
      // wouldn't have such a long XSS payload.
      reproductions.updateReproduction(message, sender);
    }*/
  };

  // Any time the page sends a message to the extension, the above handler should
  // take care of it.
  chrome.runtime.onMessage.addListener(messageRouter);
})();
