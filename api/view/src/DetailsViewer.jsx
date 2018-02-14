import React, { Component } from "react";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import HighlightedElement from "./HighlightedElement";

/* View used to show the raw request and the events for the selected tracer row. */
class DetailsViewer extends Component {
	render() {
		const index = this.props.rawEvent.indexOf(this.props.eventContext);
		var ret;
		if (this.props.rawEvent !== "") {
			//TODO: wish I knew how to calculate this
			const lineHeight = 11;
			const newLines = this.occurrences(this.props.rawEvent, "\n");

			ret = (
				<Row id="details-views" className="details-viewer">
					<Col md={6}>
						<pre className="raw-request">
							{this.props.rawRequest}
						</pre>
					</Col>

					<Col md={6}>
						<HighlightedElement
							data={this.props.rawEvent}
							start={index}
							stop={index + this.props.eventContext.length}
							scrollTo={newLines * lineHeight}
						/>
					</Col>
				</Row>
			);
		} else {
			ret = (
				<Row id="details-views" className="details-viewer">
					<Col md={6}>
						<pre className="raw-request">
							{this.props.rawRequest}
						</pre>
					</Col>

					<Col md={6}>
						<pre className="raw-data">
							Click one of the tracer events above to see the
							tracer's destination.
						</pre>
					</Col>
				</Row>
			);
		}

		return ret;
	}

	// stolen from : https://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string
	/** Function that count occurrences of a substring in a string;
	 * @param {String} string               The string
	 * @param {String} subString            The sub string to search for
	 * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
	 *
	 * @author Vitim.us https://gist.github.com/victornpb/7736865
	 * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
	 * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
	 */
	occurrences(string, subString, allowOverlapping) {
		string += "";
		subString += "";
		if (subString.length <= 0) return string.length + 1;

		var n = 0,
			pos = 0,
			step = allowOverlapping ? 1 : subString.length;

		while (true) {
			pos = string.indexOf(subString, pos);
			if (pos >= 0) {
				++n;
				pos += step;
			} else break;
		}
		return n;
	}
}

export default DetailsViewer;
