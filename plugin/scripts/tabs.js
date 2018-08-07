var i = 1000;
var promises = [];
for (var j = 0; j < i; j++) {
  promises.push(chrome.tabs.create({ url: "https://example.com" }));
}

for (var j = 0; j < i; j++) {
  setTimeout(
    promises[i].then(tab => {
      chrome.tabs.discard(tab.id);
    }),
    Math.random() * 1000
  );
}
