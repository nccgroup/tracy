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
		var ret;
		if (this.props.start !== -1) {
			const pre = this.props.data.substring(0, this.props.start);
			const highlight = this.props.data.substring(
				this.props.start,
				this.props.stop
			);
			const post = this.props.data.substring(
				this.props.stop,
				this.props.data.length
			);
			/*ret = (
				<pre className="raw-data">
					{pre}
					<code className="highlight">{highlight}</code>
					{post}
				</pre>
			);*/
			ret = (
				<HighLight
					lang={this.props.lang}
					value={pre + highlight + post}
				/>
			);
		} else {
			ret = (
				<HighLight
					className="raw-data"
					lang={this.props.lang}
					value={this.props.data}
				/>
			);
		}

		return ret;
	}
}

export default HighlightedElement;
