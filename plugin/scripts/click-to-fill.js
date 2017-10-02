/* Code used to implement the click to fill feature of the extension. Executes in the DOM. */
(function(){
    /* Globals for the HTML class names. */
    var inputClass = "xss-terminate-input";
    var enabledClass = "enabled-input";
    var disabledClass = "disabled-input";

    /* Input types we are currently supporting. */
    var supportedInputTypes = [
        "text",
        "password",
        "email",
        "url",
        "search",
        "tel"
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
        }
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
        if (tag) {
            tag.addEventListener("click", function(e) {
                var offset = getElementOffset(this);
                var rightEdge = this.getBoundingClientRect().right - offset.left;
                var mouseClickPosition = e.pageX - offset.left;

                if (mouseClickPosition / rightEdge * 100 > 87) {
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

    /* Get all the input fields. We"ll filter them using the functions below. */
    var inputs = document.getElementsByTagName("input");

    /* For all inputs, add a className to style the input. */
    Array.prototype.forEach.call(inputs, styleInputElement);

    /* Register event listeners for all types of elements we"d like to allow for a tracer. */
    Array.prototype.forEach.call(inputs, registerClickHandler);

    /* Make an event handler that checks if the tracer string template is in the textfield. */
    Array.prototype.forEach.call(inputs, registerChangeHandler);
})();
