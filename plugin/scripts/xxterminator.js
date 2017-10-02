(function() {

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node){
          if(node.nodeType == 1){
            chrome.runtime.sendMessage({'type': 'dom', 'msg': node.outerHTML}, null);// For now we don't want to use the callback handler
          } else if (node.nodeType == 3) {
            chrome.runtime.sendMessage({'type': 'text', 'msg': node.wholeText}, null);// For now we don't want to use the callback handler
          }
      });
    });
  });

  var observerConfig = {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true
  };

  observer.observe(document.documentElement, observerConfig);

    /* Use the chrome.runtime API to generate a string the looks like a JavaScript variable containing the extension ID. */
    function createChromeExtensionVariable() {
        return "var chromeExtensionId = \"" + chrome.runtime.id + "\"";
    }

    /* Add a script tag with whatever content to the DOM. */
    function addScriptTagToDom(content, source) {
        var tag = document.createElement("script");
        tag.type = "text/javascript";
        /* Add the option content. */
        if (content) {
            tag.textContent = content;
        }
        /* Add the optional src attribute. */
        if (source) {
            tag.src = source;
        }
        document.documentElement.appendChild(tag);
    }

    /* Add a style tag with whatever content to the DOM. */
    function addStyleTagToDom(content, source) {
        var tag = document.createElement("link");
            tag.rel = "stylesheet";
            tag.type = "text/css";
            /* Add the option content. */
            if (content) {
                tag.textContent = content;
            }
            /* Add the optional src attribute. */
            if (source) {
                tag.href = source;
            }
            document.documentElement.appendChild(tag);
    }

    /* Add a global variable with the chrome extension ID. */
    addScriptTagToDom(createChromeExtensionVariable(), null);
    addScriptTagToDom(null, chrome.runtime.getURL("/scripts/injected-page.js"));

    /* Add our styles to the DOM. */
    addStyleTagToDom(null, chrome.runtime.getURL("/styles/injected-page.css"))
})();
