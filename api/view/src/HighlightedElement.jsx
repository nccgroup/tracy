import React, { Component } from "react";
import ReactDOM from "react-dom";
import HighLight from "react-syntax-highlight";
import "../node_modules/highlight.js/styles/atom-one-dark.css";

/* View used to show the raw request and the events for the selected tracer row. */
class HighlightedElement extends Component {
	componentDidMount() {
		var node = ReactDOM.findDOMNode(this);
		if (node) {
			node.scrollTop = this.props.scrollTo;
		}
	}

	componentDidUpdate() {
		var node = ReactDOM.findDOMNode(this);
		if (node) {
			node.scrollTop = this.props.scrollTo;
		}
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
