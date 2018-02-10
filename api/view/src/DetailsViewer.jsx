import React, { Component } from "react";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";

/* View used to show the raw request and the events for the selected tracer row. */
class DetailsViewer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			events: [],
			interval: null,
			selectedEvent: ""
		};
	}

	render() {
		return (
			<Row id="details-views" className="details-viewer">
				<Col md={6}>
					<pre className="raw-request">{this.props.rawRequest}</pre>
				</Col>

				<Col md={6}>
					<pre className="raw-event"> {this.props.selectedEvent}</pre>
				</Col>
			</Row>
		);
	}
}

export default DetailsViewer;
