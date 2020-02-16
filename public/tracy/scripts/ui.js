(() => {
  const UI = chrome.runtime.getURL("/index.html");
  const openUI = () => chrome.tabs.create({ url: UI });

  chrome.browserAction.onClicked.addListener(tab => {
    openUI();
  });
})();
