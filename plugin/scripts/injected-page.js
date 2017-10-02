(function(){
    /* Globals for the HTML class names. */
    var buttonClass = "xss-terminate-button";
    var inputClass = "xss-terminate-input";
    var formClass = "xss-terminate-form";
    var enabled = "enabled-input";
    var disabled = "disabled-input";

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

    /* Add a button right next to the supplied input element. The button will be styled with a a class. */
    function addButtontoInputElement(inputTag) {
        if (inputTag) {
            var buttonTag = document.createElement("button");
            buttonTag.className = buttonClass;

            /* Add the button right under the input. */
            inputTag.parentNode.insertBefore(buttonTag, inputTag.nextSibling);
        }
    }

    /* Add a new class name to each input element so they can be styled by the plugin. */
    function styleInputElement(tag) {
        if (tag && supportedInputTypes.includes(tag.type)) {
            tag.className = tag.className + " " + inputClass;
            tag.className = tag.className + " " + disabled;
            tag.className = tag.className.trim();
        }
    }

    /* Add a new class name to each form element so they can be styled by the plugin. */
    function styleFormElement(tag) {
        if (tag) {
            tag.className = tag.className + " " + formClass;
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

    /* Register a click handler on an input event. */
    function registerClickHandler(tag) {
        if (tag) {
            tag.addEventListener('click', function(e) {
                var offset = getElementOffset(this);
                var rightEdge = this.getBoundingClientRect().right - offset.left;
                var mouseClickPosition = e.pageX - offset.left;

                if (mouseClickPosition / rightEdge * 100 > 87) {
                    // The button click is close to the right edge.
                    toggleEnabled(tag);
                 }

            });
        }
    }

    /* Toggle the disabled and enabled class names on input fields. */
    function toggleEnabled(tag) {
        if (tag) {
            if (tag.className.includes(enabled)) {
                /* Remove enabled. */
                tag.className = tag.className.slice(0, tag.className.indexOf(enabled)).trim();
                /* Add disabled. */
                tag.className = tag.className + " " + disabled;
                /* Clear out the text. */
                tag.value = "";
            } else if (tag.className.includes(disabled)) {
                /* Remove disabled. */
                tag.className = tag.className.slice(0, tag.className.indexOf(disabled)).trim();
                /* Add enabled. */
                tag.className = tag.className + " " + enabled;
                /* Add the tracer thing. */
                tag.value = tag.value + tracerString;
            }

            tag.className = tag.className.trim();
        }
    }

    var inputs = document.getElementsByTagName("input");
    var forms = document.getElementsByTagName("form");

    /* For all inputs, add a styled button right next to it. */
    //Array.prototype.forEach.call(inputs, addButtontoInputElement);

    /* For all inputs, add a className to style the input. */
    Array.prototype.forEach.call(inputs, styleInputElement);

    /* For all forms, add a className to style the form. */
    //Array.prototype.forEach.call(forms, styleFormElement);

    /* Register event listeners for all types of elements we'd like to allow for a tracer. */
    Array.prototype.forEach.call(inputs, registerClickHandler);
})();
