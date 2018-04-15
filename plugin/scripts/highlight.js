/* Globals for the HTML class names. */
var inputClass = "xss-terminate-input";
var enabledClass = "enabled-input";
var disabledClass = "disabled-input";

/* Inline CSS object. */
var inlineCSS = {
	"background-image":
		"url('" + chrome.runtime.getURL("/images/tracy_svg.svg") + "')",
	"background-repeat": "no-repeat",
	"background-attachment": "scroll",
	"background-size": "16px 18px",
	"background-position": "98% 50%",
	cursor: "pointer",
	border: "solid #67baaf"
};

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
		tag.classList.add(inputClass);
		tag.classList.add(disabledClass);

		addStylesToElement(tag, inlineCSS);
	} else {
		/* If an input is marked as disabled, remove our added inline styles and
        classes. */
		removeStylesToElement(tag, inlineCSS);
	}
}

/* Add a new class name to each input element so they can be styled by the plugin. */
function styleInputElement(tag) {
	styleElement(tag);
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

/* Function to help identify if an event happened near the left edge of an element. */
function isNearLeftEdge(element, event) {
	let ret = false;
	let offset = getElementOffset(element);
	let rightEdge = element.getBoundingClientRect().right - offset.left;
	let mouseClickPosition = event.pageX - offset.left;

	if (mouseClickPosition / rightEdge * 100 > 65) {
		ret = true;
	}

	return ret;
}

/* Function used for catching a long click near the end of an input field to get a list of tracer strings. */
function registerLongPauseHandler(e) {
	if (isNearLeftEdge(this, e)) {
		/* This timer is used to check for a long press */

		var tagMenu = document.createElement("div");
		tagMenu.id = "tag-menu";
		var list = document.createElement("ul");

		tagMenu.appendChild(list);

		/* Create the list of tracers types they can choose from. Dynamically
               		* create them so we can easily add new types of tracer types. */
		chrome.runtime.sendMessage(
			{
				"message-type": "config",
				config: "tracer-string-types"
			},
			tracerStringTypes => {
				for (var tracerStringTypeKey in tracerStringTypes) {
					var listElement = document.createElement("li");

					listElement.addEventListener("mousedown", el => {
						var payload;
						if (
							el.target.innerText.toLowerCase().startsWith("gen")
						) {
							generateTracerPayload(el.target.innerText)
								.then(res => res.json())
								.then(res => {
									console.log(res);
									/* Add the tracer string template. */
									e.target.value =
										e.target.value +
										res.Tracers[0].TracerPayload;
									/* If the user uses the drop down for the first element, toggle the box on. */
									toggleEnabled(e.target);
									tagMenu.parentNode.removeChild(tagMenu);
								})
								.catch(error => console.error("Error:", error));
						} else {
							/* Add the tracer string template. */
							e.target.value =
								e.target.value + el.currentTarget.innerText;
							/* If the user uses the drop down for the first element, toggle the box on. */
							toggleEnabled(e.target);
							tagMenu.parentNode.removeChild(tagMenu);
						}
					});

					listElement.classList.add("highlight-on-hover");
					/* Highlight the element when you mouseover it. */
					listElement.innerText =
						tracerStringTypes[tracerStringTypeKey];
					list.appendChild(listElement);
				}

				//insert into root of DOM so nothing can mess it up now
				document.documentElement.appendChild(tagMenu);

				tagMenu.style.left = e.pageX + "px";
				tagMenu.style.top = e.pageY + "px";

				// Set timer to null as it has fired once
				tagMenuTimer = null;
			}
		);
	}
}

/* Helper function to make an API request to generate a tracer payload from a tracer string. */
function generateTracerPayload(tracerString) {
	return fetch(
		`http://127.0.0.1:8081/tracers/generate?tracer_string=${tracerString}&url=${
			document.location
		}`,
		{
			headers: {
				Hoot: "!",
				"X-TRACY": "NOTOUCHY"
			}
		}
	);
}

/* Register a click handler on an input element. */
function registerClickHandler(tag) {
	/* If the input element has an input class name, we have already added the event listener. */
	if (tag && !tag.className.includes(inputClass)) {
		tag.addEventListener("mousedown", registerLongPauseHandler);
	}
}

/* on mouseUp listener on whole window to capture all mouse up events */
document.addEventListener("mousedown", function(e) {
	var menuElement = document.getElementById("tag-menu");

	if (menuElement != null) {
		menuElement.parentNode.removeChild(menuElement);
	}
});

/* Register a change handler on an input element. */
function registerChangeHandler(tag) {
	if (tag && !tag.disabled) {
		tag.addEventListener("change", function(e) {
			chrome.runtime.sendMessage(
				{
					"message-type": "config",
					config: "tracer-string-types"
				},
				tracerStringTypes => {
					for (var tracerStringTypeKey in tracerStringTypes) {
						if (
							this.value.includes(
								tracerStringTypes[tracerStringTypeKey]
							)
						) {
							toggleOn(this);
							return;
						}
					}

					toggleOff(this);
				}
			);
		});
	}
}

/* Toggle an element on. */
function toggleOn(tag) {
	tag.classList.remove(disabledClass);
	tag.classList.add(enabledClass);
	tag.style["border"] = "solid #67baaf";
}

/* Toggle an element off. */
function toggleOff(tag) {
	tag.classList.add(disabledClass);
	tag.classList.remove(enabledClass);
	tag.style["border"] = "solid #67baaf";
}

/* Toggle the disabled and enabled class names on input fields. */
function toggleEnabled(tag) {
	if (tag) {
		var enabled = false;
		if (tag.className.includes(disabledClass)) {
			toggleOn(tag);
			/* Enabled should be true. */
			enabled = true;
		}

		return enabled;
	}
}

/* Find all the inputs and style them with the extension. */
function clickToFill(element) {
	let inputs = [
		...element.getElementsByTagName("input"),
		...element.getElementsByTagName("textarea")
	].filter(tag => {
		return (
			["text", "url", "search"].includes(tag.type) ||
			tag.nodeName.toLowerCase() == "textarea"
		);
	});

	/* Register event listeners for all types of elements we"d like to allow for a tracer. */
	inputs.map(registerClickHandler);

	/* For all inputs and textareas, add a className to style the input. */
	inputs.map(styleInputElement);

	/* Make an event handler that checks if the tracer string template is in the textfield. */
	inputs.map(registerChangeHandler);
}
