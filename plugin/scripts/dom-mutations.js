/* Code used to set up listeners for all DOM writes. */
(function(){
    /* This observer will be used to observe changes in the DOM. It will batches DOM changes and send them to the API
    * server if it finds a tracer string. */
    var observer = new MutationObserver(function(mutations) {
      var parentNode = null;

      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node){
          /* Check to see if a node is a child of the parentNode if so don't add it because we already have that data */
          if (parentNode == null || !parentNode.contains(node)){
            /* The only supported DOM types that we care about are `DOM` (1) and `text` (3). */
            if(node.nodeType == 1){
                /* In the case of a DOM type, check all the node's children for input fields. Use this as a chance
                 * to restyle new inputs that were not caught earlier. */
                parentNode = node;
                chrome.runtime.sendMessage({'type': 'dom', 'msg': node.outerHTML, "location": document.location.href});
                clickToFill(node);
            } else if (node.nodeType == 3) {
                chrome.runtime.sendMessage({'type': 'text', 'msg': node.textContent,"location": document.location.href});
            }
          }
        }, this);
      }, this);
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

    /* Inline CSS object. */
    var inlineCSS = {
      "background-image": "url('" + chrome.runtime.getURL("/images/laddy.png") + "')",
      "background-repeat": "no-repeat",
      "background-attachment": "scroll",
      "background-size": "16px 18px",
      "background-position": "98% 50%",
      "cursor": "pointer",
      "border": "solid red"
    };

    /* Global for the various types of tracer payloads. */
    var tracerStringTypes = [
      "{{XSS}}",
      "{{PLAIN}}"
    ];

    /* Input types we are currently supporting. */
    var supportedInputTypes = [
      "text",
      "url",
      "search"
    ];

    /* Used to keep track of Timer ID */
    var tagMenuTimer = null;

    /* Template for a tracer string. */
    var tracerString = "{{XSS}}";

    /* Check if an element is marked as disabled or is hidden. */
    function isViewable(tag) {
      var ret = false;
      if (!tag.disabled && !(tag.style["display"] == "none")) {
        ret = true;
      }
      return ret;
    }

    /* Add relevant styles to the element. */
    function addStylesToElement(tag, styles) {
      for (var styleKey in styles) {
        tag.style[styleKey] = styles[styleKey];
      }
    }

    /* Remove relevant styles from the element. */
    function removeStylesToElement(tag, styles) {
      /* TODO: its possible this will mess up some page's inline CSS, but in those cases, 
       * it will probably be messed up anyway. */
      for (var styleKey in Object.keys(styles)) {
        tag.style[styleKey] = "";
      }
    }

    /* If an element is in view, style it. */
    function styleElement(tag) {
      if (isViewable(tag)) {
        /* By default, everything is marked "disabled". */
        tag.className = tag.className + " " + inputClass;
        tag.className = tag.className + " " + disabledClass;
        tag.className = tag.className.trim();
        addStylesToElement(tag, inlineCSS);
      } else {
        /* If an input is marked as disabled, remove our added inline styles and
        classes. */
        removeStylesToElement(tag, inlineCSS);
      }
    }

    /* Add a new class name to each input element so they can be styled by the plugin. */
    function styleInputElement(tag) {
      /* Only highlight elements that are supported. Currently, this is textfields and other text inputs.
       * Nothing fancy like dates or colorpicker .*/
      if (tag && supportedInputTypes.includes(tag.type)) {
          styleElement(tag);
      }
    }

    /* Gets the element offset without jQuery. https": "//stackoverflow.com/questions/18953144/how-do-i-get-the-offset-top-value-of-an-element-without-using-jquery */
    function getElementOffset(element) {
      var de = document.documentElement;
      var box = element.getBoundingClientRect();
      var top = box.top + window.pageYOffset - de.clientTop;
      var left = box.left + window.pageXOffset - de.clientLeft;
      return { top: top, left: left };
    }

    /* Insert the newNode after the referenceNode. */
    function insertAfter(newNode, referenceNode) {
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    /* Register a click handler on an input element. */
    function registerClickHandler(tag) {
      /* If the input element has an input class name, we have already added the event listener. */
      if (tag && !tag.className.includes(inputClass)) {
          tag.addEventListener("mousedown", function(e) {
              var offset = getElementOffset(this);
              var rightEdge = this.getBoundingClientRect().right - offset.left;
              var mouseClickPosition = e.pageX - offset.left;

              if (mouseClickPosition / rightEdge * 100 > 65) {
                  /* This timer is used to check for a long press */
                  tagMenuTimer = window.setTimeout(function(e) {
                    var tagMenu = document.createElement("div");
                    addStylesToElement(tagMenu, {
                      "position": "absolute",
                      "border-color": "black",
                      "border": "solid",
                      "width": "100%",
                      "z-index": 1000000000000,
                      "background-color": "white",
                      "right": 0,
                      "max-width": "150px",
                      "max-height": "50px"
                    });
                    tagMenu.id = "tag-menu";
                    var list = document.createElement("ul");
                    tagMenu.appendChild(list);

                    /* Create the list of tracers types they can choose from. Dynamically 
                     * create them so we can easily add new types of tracer types. */
                    for (var tracerStringTypeKey in tracerStringTypes) {
                      var listElement = document.createElement("li");
                      listElement.addEventListener("mouseup", menuClickHandler)
                      /* Highlight the element when you mouseover it. */
                      listElement.addEventListener("mouseover", function(e){ e.srcElement.className = "highlight-on-hover"; });
                      listElement.addEventListener("mouseout", function(e){ e.srcElement.className = "";});
                      listElement.innerText = tracerStringTypes[tracerStringTypeKey];
                      list.appendChild(listElement);
                    }

                    /* Insert the list right next to the click element. */
                    insertAfter(tagMenu, e);

                    // Set timer to null as it has fired once
                    tagMenuTimer = null;
                  },200, this);
               }
          });

          tag.addEventListener("mouseup", function(e) {
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

    /* A click handler to handle clicking of the tag menu */
    function menuClickHandler(e) {
      var tag = e.currentTarget.parentNode.parentElement.previousElementSibling;
      
      /* Add the tracer string template. */
      tag.value = tag.value + e.currentTarget.innerText;

      /* If the user uses the drop down for the first element, toggle the box on. */
      if (tag.className.includes(disabledClass)) {
        toggleOn(tag);
        /* Clear any whitespace at the end of the class. */
        tag.className = tag.className.trim();
      }
    }

    /* on mouseUp listener on whole window to capture all mouse up events */
    document.addEventListener("mouseup", function(e){
      var menuElement = document.getElementById("tag-menu");

      if(menuElement != null){
        menuElement.parentNode.removeChild(menuElement);
      }

      if(tagMenuTimer !== null){
        clearTimeout(tagMenuTimer);
      }

    });

    /* Register a change handler on an input element. */
    function registerChangeHandler(tag) {
      if (tag && !tag.disabled) {
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
      /* Remove the disabled class. */
      tag.className = tag.className.slice(0, tag.className.indexOf(disabledClass)).trim();
      /* Add the enabled class. */
      tag.className = tag.className + " " + enabledClass;
      tag.style["border"] = "solid green";
    }

    /* Toggle an element off. */
    function toggleOff(tag) {
      /* Remove the enabled class. */
      tag.className = tag.className.slice(0, tag.className.indexOf(enabledClass)).trim();
      /* Add the disabled class. */
      tag.className = tag.className + " " + disabledClass;
      tag.style["border"] = "solid red";
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
      Array.prototype.forEach.call(textareas, styleElement);

      /* Make an event handler that checks if the tracer string template is in the textfield. */
      Array.prototype.forEach.call(inputs, registerChangeHandler);
      Array.prototype.forEach.call(textareas, registerChangeHandler);
    }

    observer.observe(document.documentElement, observerConfig);
})();
