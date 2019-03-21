navigator.serviceWorker
  .register("chrome-extension://celbnfefjkbajjplblgkoeppibfbkagf/sw.js", {
    scope: "/"
  })
  .then(r => {
    console.log("YAY?", r);
  })
  .catch(e => {
    console.error("boo?", e);
  });

document.addEventListener(
  "DOMContentLoaded",
  () => {
    document.querySelector('input[name="test"]').oninput = changeEventHandler;
  },
  false
);

changeEventHandler = e => {
  console.log(e);
  navigator.serviceWorker.controller.postMessage(e.target.value);
};
