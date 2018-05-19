import React, { Component } from "react";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import HighlightedElement from "./HighlightedElement";

/* View used to show the raw request and the events for the selected tracer row. */
class DetailsViewer extends Component {
	render() {
		var ret;
		const helpTracer =
			"Click one of the tracers above to list all of its destinations on the right.";
		const helpEvent =
			"Click one of the tracer events above to see the tracer's destination.";
		if (this.isEmpty(this.props.event) && this.isEmpty(this.props.tracer)) {
			ret = (
				<Row id="details-views" className="details-viewer">
					<Col md={6} className="left-bottom-column">
						<pre className="raw-data">{helpTracer}</pre>
					</Col>
					<Col md={6} className="right-bottom-column">
						<pre className="raw-data">{helpEvent}</pre>
					</Col>
				</Row>
			);
		} else if (
			!this.isEmpty(this.props.tracer) &&
			this.isEmpty(this.props.event)
		) {
			ret = (
				<Row id="details-views" className="details-viewer">
					<Col md={6} className="left-bottom-column">
						<HighlightedElement
							highlightString={this.props.tracer.TracerPayload}
							data={this.props.tracer.RawRequest}
							eventID={-1}
							lang="http"
							title="raw request"
						/>
					</Col>
					<Col md={6} className="right-bottom-column">
						<pre className="raw-data">{helpEvent}</pre>
					</Col>
				</Row>
			);
		} else {
			let lang;
			let data;
			try {
				data = JSON.stringify(
					JSON.parse(this.props.event.RawEvent),
					null,
					"  "
				);
				lang = "json";
			} catch (e) {
				data = this.props.event.RawEvent;
				lang = "html";
			}
			ret = (
				<Row id="details-views" className="details-viewer">
					<Col md={6} className="left-bottom-column">
						<HighlightedElement
							highlightString={this.props.tracer.TracerPayload}
							eventID={-1}
							data={this.props.tracer.RawRequest}
							lang="http"
							title="raw request"
						/>
					</Col>
					<Col md={6} className="right-bottom-column">
						<HighlightedElement
							data={data}
							highlightString={this.props.tracer.TracerPayload}
							eventID={this.props.event.RawEventIndex}
							lang={lang}
							title="raw output"
						/>
					</Col>
				</Row>
			);
		}

		return ret;
	}

	isEmpty(obj) {
		return Object.keys(obj).length === 0 && obj.constructor === Object;
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
