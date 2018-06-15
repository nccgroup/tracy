/* Gets the element offset without jQuery. https": "//stackoverflow.com/questions/18953144/how-do-i-get-the-offset-top-value-of-an-element-without-using-jquery */
function getElementOffset(element) {
	const de = document.documentElement;
	const box = element.getBoundingClientRect();
	const top = box.top + window.pageYOffset - de.clientTop;
	const left = box.left + window.pageXOffset - de.clientLeft;
	return { top: top, left: left };
}

/* Insert the newNode after the referenceNode. */
function insertAfter(newNode, referenceNode) {
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/* Function to help identify if an event happened near the left edge of an element. */
function isNearLeftEdge(element, event) {
	let ret = false;
	const offset = getElementOffset(element);
	const rightEdge = element.getBoundingClientRect().right - offset.left;
	const mouseClickPosition = event.pageX - offset.left;
	let buttonWidth = element.getBoundingClientRect().width * 0.3;

	if (buttonWidth > 50) {
		buttonWidth = 50;
	}

	if (rightEdge - mouseClickPosition < buttonWidth) {
		ret = true;
	}

	return ret;
}

/* Function used for catching a long click near the end of an input field to get a list of tracer strings. */
function registerLongPauseHandler(e) {
	if (isNearLeftEdge(this, e)) {
		/* This timer is used to check for a long press */
		const tagMenu = document.createElement("div");
		tagMenu.id = "tag-menu";
		const list = document.createElement("ul");
		tagMenu.appendChild(list);

		/* Create the list of tracers types they can choose from. Dynamically
         * create them so we can easily add new types of tracer types. */
		chrome.runtime.sendMessage(
			{
				"message-type": "config",
				config: "tracer-string-types"
			},
			tracerStringTypes => {
				for (let tracerStringTypeKey in tracerStringTypes) {
					const listElement = document.createElement("li");

					listElement.addEventListener("mousedown", el => {
						let payload;
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
	tag.addEventListener("mousedown", registerLongPauseHandler);
}

/* on mouseUp listener on whole window to capture all mouse up events */
document.addEventListener("mousedown", function(e) {
	const menuElement = document.getElementById("tag-menu");

	if (menuElement != null) {
		menuElement.parentNode.removeChild(menuElement);
	}
});

/* Find all the inputs and style them with the extension. */
function clickToFill(element) {
	const inputs = [
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
}
