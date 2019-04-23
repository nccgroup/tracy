import React, { PureComponent } from "react";
import ReactDOM from "react-dom";
import HighLight from "react-syntax-highlight";
import "../node_modules/highlight.js/styles/atom-one-dark.css";

/* View used to show the raw request and the events for the selected tracer row. */
class HighlightedElement extends PureComponent {
	constructor(props) {
		super(props);

		this.highlightSelection = this.highlightSelection.bind(this);
	}

	componentDidMount() {
		var node = ReactDOM.findDOMNode(this);
		if (node) {
			this.highlightSelection(node);
		}
	}

	componentDidUpdate() {
		var node = ReactDOM.findDOMNode(this);
		if (node) {
			this.highlightSelection(node);
		}
	}

	highlightSelection(node) {
		let textNodes = this.textNodesUnder(node);
		var highlightIndex = -1;
		if (textNodes && textNodes.length > 0) {
			for (var i = 0; i < textNodes.length; i++) {
				const data = textNodes[i].textContent;
				const idx = data.indexOf(this.props.highlightString);
				if (idx !== -1) {
					const pre = data.substring(0, idx);
					const highlight = data.substring(
						idx,
						idx + this.props.highlightString.length
					);
					const post = data.substring(
						idx + this.props.highlightString.length,
						data.length
					);

					if (
						textNodes[i].parentNode.nodeName.toLowerCase() ===
						"span"
					) {
						let styledSpan = document.createElement("span");
						styledSpan.classList.add("highlight");
						styledSpan.innerText = highlight;

						let preSpan = document.createElement("span");
						preSpan.innerText = pre;

						let postSpan = document.createElement("span");
						postSpan.innerText = post;

						let parent = textNodes[i].parentNode;
						parent.removeChild(textNodes[i]);
						parent.appendChild(preSpan);
						parent.appendChild(styledSpan);
						parent.appendChild(postSpan);

						highlightIndex++;
						if (highlightIndex === this.props.highlightOffset) {
							styledSpan.scrollIntoView();
						}
					} else if (
						textNodes[i].parentNode.nodeName.toLowerCase() ===
							"code" &&
						textNodes[i].previousSibling
					) {
						let styledSpan = document.createElement("span");
						styledSpan.classList.add("highlight");
						styledSpan.innerText = highlight;

						let preSpan = document.createElement("span");
						preSpan.innerText = pre;

						let postSpan = document.createElement("span");
						postSpan.innerText = post;

						let parent = textNodes[i].parentNode;
						let sibling = textNodes[i].previousSibling;

						parent.removeChild(textNodes[i]);
						sibling.appendChild(preSpan);
						sibling.appendChild(styledSpan);
						sibling.appendChild(postSpan);

						highlightIndex++;
						if (highlightIndex === this.props.highlightOffset) {
							styledSpan.scrollIntoView();
						}
					} else {
						console.error("panic");
					}
				}
			}
		}
	}

	textNodesUnder(el) {
		var n,
			a = [],
			walk = document.createTreeWalker(
				el,
				NodeFilter.SHOW_TEXT,
				null,
				false
			);
		while ((n = walk.nextNode())) a.push(n);
		return a;
	}

	render() {
		return (
			<HighLight
				className="raw-data"
				lang={this.props.lang}
				value={this.props.data}
			/>
		);
	}
}

export default HighlightedElement;
