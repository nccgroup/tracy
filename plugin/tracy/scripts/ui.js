(() => {
  // Always want the autofill menu there.
  chrome.contextMenus.create({
    id: "auto-fill",
    title: "Auto-fill page",
    contexts: ["all"],
    onclick: (info, tab) => {
      chrome.tabs.sendMessage(tab.id, {
        cmd: "auto-fill"
      });
    }
  });

  chrome.contextMenus.create({
    id: "sep",
    type: "separator",
    contexts: ["all"]
  });

  const paintIcon = d => {
    if (d) {
      chrome.browserAction.setIcon({
        path: "../tracy/images/tracy_16x16_x.png"
      });
    } else {
      chrome.browserAction.setIcon({
        path: "../tracy/images/tracy_16x16.png"
      });
    }
  };

  paintIcon(settings.isDisabled());
  chrome.browserAction.onClicked.addListener(tab => {
    settings.setDisabled(!settings.isDisabled());
    paintIcon(settings.disabled);
  });
})();
