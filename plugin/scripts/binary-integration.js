(function() {
	var port;

	//TODO: probably aren't doing this
	/*chrome.browserAction.onClicked.addListener(() => {
		if (port) {
			port.disconnect();
			port = null;
			browser.browserAction.setIcon({ path: "images/tracy_svg1.svg" });
		} else {
			port = chrome.runtime.connectNative("tracy");
			browser.browserAction.setIcon({ path: "images/laddy.png" });
		}
	});*/
})();
