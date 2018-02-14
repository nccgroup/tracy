import React, { Component } from "react";
import ReactDOM from "react-dom";

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
		const pre = this.props.data.substring(0, this.props.start);
		const highlight = this.props.data.substring(
			this.props.start,
			this.props.stop
		);
		const post = this.props.data.substring(
			this.props.stop,
			this.props.data.length
		);
		const ret = (
			<pre className="raw-data">
				{pre}
				<code className="highlight">{highlight}</code>
				{post}
			</pre>
		);

		return ret;
	}
}

export default HighlightedElement;
