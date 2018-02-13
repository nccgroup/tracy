import React, { Component } from "react";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
//import HighlightedElement from "./HighlightedElement";

/* View used to show the raw request and the events for the selected tracer row. */
class DetailsViewer extends Component {
	render() {
		//TODO: headers not supported yet because of how golang is currently parsing the requests

		/*var requestStart = this.props.requestStart;
		console.log("type: ", this.props.requestLocationType);
		switch ([this.props.requestLocationType]) {
			case 0:
				//TODO: not supported (header)
				break;
			case 1:
				console.log("here?");
				var offset = this.props.rawRequest.indexOf("?");
				if (offset !== -1) {
					// Add the bytes for the method and path
					requestStart += offset;
				}
				break;
			case 2:
				var offset = this.props.rawRequest.indexOf("\n\n");
				if (offset !== -1) {
					// Add all the bytes for the headers
					requestStart += offset;
				}
				break;
			default:
				console.error("Unsupported location type.");
		}
		console.log(this.props.rawRequest);
		console.log(this.props.requestStart);*/

		return (
			<Row id="details-views" className="details-viewer">
				<Col md={6}>
					<pre className="raw-request">{this.props.rawRequest}</pre>
				</Col>

				<Col md={6}>
					<pre className="raw-event"> {this.props.rawEvent}</pre>
				</Col>
			</Row>
		);
	}
}

export default DetailsViewer;
/*<Col md={6}>
					<HighlightedElement
						className="raw-request"
						data={this.props.rawRequest}
						start={requestStart}
						stop={this.props.requestStop}
					/>
				</Col>

				<Col md={6}>
					<HighlightedElement
						className="raw-event"
						data={this.props.rawEvent}
						start={this.props.eventStart}
						stop={this.props.eventStop}
					/>
				</Col>*/
