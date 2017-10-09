/* Code used to set up listeners for all DOM writes. */
(function(){
    /* This observer will be used to observe changes in the DOM. It will batches DOM changes and send them to the API
    * server if it finds a tracer string. */
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node){
                /* The only supported DOM types that we care about are `DOM` (1) and `text` (3). */
                if(node.nodeType == 1){
                    /* In the case of a DOM type, check all the node's children for input fields. Use this as a chance
                     * to restyle new inputs that were not caught earlier. */
                    chrome.runtime.sendMessage({'type': 'dom', 'msg': node.outerHTML, "location": document.location});
                    clickToFill(node);
                } else if (node.nodeType == 3) {
                    chrome.runtime.sendMessage({'type': 'text', 'msg': node.wholeText,"location": document.location});
                }
            });
        });
    });

    /* The configuration for the observer. We want to pretty much watch for everything. */
    var observerConfig = {
        attributes:     true,
        childList:      true,
        characterData:  true,
        subtree:        true
    };

    /* Globals for the HTML class names. */
    var inputClass = "xss-terminate-input";
    var enabledClass = "enabled-input";
    var disabledClass = "disabled-input";

    /* Inline CSS string. */
    var inlineCSSEnabled = "background-image: url('"+chrome.runtime.getURL("/images/laddy.png")+"');" +
          "background-repeat: no-repeat;" +
          "background-attachment: scroll;" +
          "background-size: 16px 18px;" +
          "background-position: 98% 50%;" +
          "cursor: pointer;" +
          "border: solid green;";

    var inlineCSSDisabled = "background-image: url('"+chrome.runtime.getURL("/images/laddy.png")+"');" +
          "background-repeat: no-repeat;" +
          "background-attachment: scroll;" +
          "background-size: 16px 18px;" +
          "background-position: 98% 50%;" +
          "cursor: pointer;" +
          "border: solid red;";

    /* Input types we are currently supporting. */
    var supportedInputTypes = [
      "text",
      "url",
      "search"
    ];

    /* Template for a tracer string. */
    var tracerString = "{{XSS}}";

    /* Add a new class name to each input element so they can be styled by the plugin. */
    function styleInputElement(tag) {
      /* Only highlight elements that are supported. Currently, this is textfields and other text inputs.
       * Nothing fancy like dates or colorpicker .*/
      if (tag && supportedInputTypes.includes(tag.type)) {
          /* By default, everything is marked "disabled". */
          tag.className = tag.className + " " + inputClass;
          tag.className = tag.className + " " + disabledClass;
          tag.className = tag.className.trim();
          tag.style = inlineCSSDisabled;
      }
    }

    function styleTextAreaElement(tag) {
      /* By default, everything is marked "disabled". */
      tag.className = tag.className + " " + inputClass;
      tag.className = tag.className + " " + disabledClass;
      tag.className = tag.className.trim();
      tag.style = inlineCSSDisabled;
    }

    /* Gets the element offset without jQuery. https://stackoverflow.com/questions/18953144/how-do-i-get-the-offset-top-value-of-an-element-without-using-jquery */
    function getElementOffset(element) {
      var de = document.documentElement;
      var box = element.getBoundingClientRect();
      var top = box.top + window.pageYOffset - de.clientTop;
      var left = box.left + window.pageXOffset - de.clientLeft;
      return { top: top, left: left };
    }

    /* Register a click handler on an input element. */
    function registerClickHandler(tag) {
      /* If the input element has an input class name, we have already added the event listener. */
      if (tag && !tag.className.includes(inputClass)) {
          tag.addEventListener("click", function(e) {
              var offset = getElementOffset(this);
              var rightEdge = this.getBoundingClientRect().right - offset.left;
              var mouseClickPosition = e.pageX - offset.left;

              if (mouseClickPosition / rightEdge * 100 > 65) {
                  // The click event is close to the right edge of the input field.
                  var enabled = toggleEnabled(tag);
                  if (enabled) {
                      /* Add the tracer string template. */
                      tag.value = tag.value + tracerString;
                  } else {
                      /* Clear out the text. */
                      tag.value = "";
                  }
               }
          });
      }
    }

    /* Register a change handler on an input element. */
    function registerChangeHandler(tag) {
      if (tag) {
          tag.addEventListener("change", function(e) {
              if (this.value.includes(tracerString)) {
                  toggleOn(this);
              } else {
                  toggleOff(this);
              }
          });
      }
    }

    /* Toggle an element on. */
    function toggleOn(tag) {
      if (tag) {
          if (tag.className.includes(disabledClass)) {
              /* Remove the disabled class. */
              tag.className = tag.className.slice(0, tag.className.indexOf(disabledClass)).trim();
              /* Add the enabled class. */
              tag.className = tag.className + " " + enabledClass;
              tag.style = inlineCSSEnabled;
          }
      }
    }

    /* Toggle an element off. */
    function toggleOff(tag) {
      if (tag) {
          if (tag.className.includes(enabledClass)) {
              /* Remove the enabled class. */
              tag.className = tag.className.slice(0, tag.className.indexOf(enabledClass)).trim();
              /* Add the disabled class. */
              tag.className = tag.className + " " + disabledClass;
              tag.style = inlineCSSDisabled;
          }
      }
    }

    /* Toggle the disabled and enabled class names on input fields. */
    function toggleEnabled(tag) {
      if (tag) {
          var enabled = false;
          if (tag.className.includes(enabledClass)) {
              toggleOff(tag);
          } else if (tag.className.includes(disabledClass)) {
              toggleOn(tag);
              /* Enabled should be true. */
              enabled = true;
          }

          /* Clear any whitespace at the end of the class. */
          tag.className = tag.className.trim();

          return enabled;
      }
    }

    /* Find all the inputs and style them with the extension. */
    function clickToFill(element) {
      /* Get all the input fields. We"ll filter them using the functions below. */
      var inputs = element.getElementsByTagName("input");

      /* Get all the text fields. We"ll filter them using the functions below. */
      var textareas = element.getElementsByTagName("textarea");

      /* Register event listeners for all types of elements we"d like to allow for a tracer. */
      Array.prototype.forEach.call(inputs, registerClickHandler);
      Array.prototype.forEach.call(textareas, registerClickHandler);

      /* For all inputs and textareas, add a className to style the input. */
      Array.prototype.forEach.call(inputs, styleInputElement);
      Array.prototype.forEach.call(textareas, styleTextAreaElement);

      /* Make an event handler that checks if the tracer string template is in the textfield. */
      Array.prototype.forEach.call(inputs, registerChangeHandler);
      Array.prototype.forEach.call(textareas, registerChangeHandler);
    }

    observer.observe(document.documentElement, observerConfig);
})();
