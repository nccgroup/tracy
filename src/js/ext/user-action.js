export const userActionInit = () => {
  const UI = chrome.runtime.getURL("ui.html");
  const openUI = () => chrome.tabs.create({ url: UI });
  console.log("hi");
  chrome.browserAction.onClicked.addListener((tab) => {
    openUI();
  });
};
