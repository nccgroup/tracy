import React, { Component } from "react";
import HighlightedElement from "./HighlightedElement";

class TracerDetails extends Component {
	shouldComponentUpdate(nextProps, nextState) {
		let ret = false;
		if (
			nextProps.highlightString !== this.props.highlightString ||
			nextProps.data !== this.props.data
		) {
			if (
				!(
					nextProps.data === "GENERATED" &&
					this.props.data === "GENERATED"
				)
			) {
				ret = true;
			}
		}

		return ret;
	}
	render() {
		return (
			<HighlightedElement
				highlightString={this.props.highlightString}
				highlightOffset={-1}
				data={this.props.data}
				lang="http"
				title="raw request"
			/>
		);
	}
}

export default TracerDetails;
