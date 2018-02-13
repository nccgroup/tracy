import React, { Component } from "react";

/* View used to show the raw request and the events for the selected tracer row. */
class HighlightedElement extends Component {
	render() {
		const pre = this.props.data.substring(0, this.props.start);
		console.log("pre:", pre);
		const highlight = this.props.data.substring(
			this.props.start,
			this.props.stop
		);
		const post = this.props.data.substring(
			this.props.stop,
			this.props.data.length
		);
		return (
			<pre>
				{pre}
				<code className="highlight">{highlight}</code>
				{post}
			</pre>
		);
	}
}

export default HighlightedElement;
