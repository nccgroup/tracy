import React, { Component } from "react";
import TracerTable from "./TracerTable";
import DetailsViewer from "./DetailsViewer";
import FilterColumn from "./FilterColumn";
import DOMContextViewer from "./DOMContextViewer";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			tracerID: -1,
			rawEvent: "",
			requestIndex: 0,
			tracerStringLength: 0,
			tracerPayloadLength: 0,
			eventIndex: 0,
			rawRequest: "",
			requestLocationType: 0,
			eventContext: ""
		};
		this.handleFilterChange = this.handleFilterChange.bind(this);
		this.handleTracerSelection = this.handleTracerSelection.bind(this);
		this.handleEventSelection = this.handleEventSelection.bind(this);
	}

	/* Called whenever one of the filter buttons is toggled. */
	handleFilterChange(evt, filter) {
		this.setState((prevState, props) => {
			let ret = {};
			ret[evt] = filter;
			return ret;
		});
	}

	/* Called whenever a new tracer row is selected. */
	handleTracerSelection(
		nTracerID,
		nRawRequest,
		nRequestIndex,
		nRequestLocationType,
		nTracerStringLength,
		nTracerPayloadLength
	) {
		this.setState({
			tracerID: nTracerID,
			rawRequest: nRawRequest,
			requestIndex: nRequestIndex,
			requestLocationType: nRequestLocationType,
			tracerStringLength: nTracerStringLength,
			tracerPayloadLength: nTracerPayloadLength
		});
	}

	/* Called whenever a new event is select. */
	handleEventSelection(nRawEvent, nEventContext) {
		this.setState({
			rawEvent: nRawEvent,
			eventContext: nEventContext
		});
	}

	render() {
		const contextKeys = [
			"responses",
			"exploitable",
			"archivedContexts",
			"text"
		];

		const tracerKeys = ["archivedTracers", "inactive"];

		const contextFilters = Object.keys(this.state)
			.filter(
				function(n) {
					return contextKeys.includes(n) && this.state[n];
				}.bind(this)
			)
			.map(
				function(n) {
					return this.state[n];
				}.bind(this)
			);

		const tracerFilters = Object.keys(this.state)
			.filter(
				function(n) {
					return tracerKeys.includes(n) && this.state[n];
				}.bind(this)
			)
			.map(
				function(n) {
					return this.state[n];
				}.bind(this)
			);

		return (
			<Row>
				<Col md={12} className="container">
					<Row className="header">
						<Col md={4}>
							<FilterColumn
								handleChange={this.handleFilterChange}
							/>
						</Col>
						<Col md={4}>
							<div className="title">Tracy</div>
						</Col>
						<Col md={4} />
					</Row>
					<Row>
						<Col md={6} className="left-column">
							<TracerTable
								tracerFilters={tracerFilters}
								handleTracerSelection={
									this.handleTracerSelection
								}
							/>
						</Col>
						<Col md={6} className="right-column">
							<DOMContextViewer
								tracerID={this.state.tracerID}
								handleEventSelection={this.handleEventSelection}
								contextFilters={contextFilters}
							/>
						</Col>
					</Row>
					<Row>
						<Col md={12}>
							<DetailsViewer
								rawRequest={this.state.rawRequest}
								requestStart={this.state.requestIndex}
								requestLocationType={
									this.state.requestLocationType
								}
								tracerStringLength={
									this.state.tracerStringLength
								}
								tracerPayloadLength={
									this.state.tracerPayloadLength
								}
								eventContext={this.state.eventContext}
								rawEvent={this.state.rawEvent}
							/>
						</Col>
					</Row>
				</Col>
			</Row>
		);
	}
}

export default App;
