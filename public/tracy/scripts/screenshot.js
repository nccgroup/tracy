const screenshot = (() => {
  // handleScreenshot takes a screenshot of the requesting tab,
  // then sends it back to the request tab so that it can be
  // used in the input capture.
  const take = async (message, sender, callback) => {
    callback({
      "message-type": "screenshot-done",
      dURI: await captureScreenshot(sender.tab.id)
    });
  };

  // captureScreenshot creates an image of that tab with the specified dimensions
  // and offset.
  const captureScreenshot = async tabID => {
    const tab = await new Promise(r => chrome.tabs.get(tabID, tab => r(tab)));
    return await new Promise(r =>
      chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, d => r(d))
    );
  };

  return { take: take };
})();
