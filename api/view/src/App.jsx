import React, { Component } from "react";
import TracerTable from "./TracerTable";
import DetailsViewer from "./DetailsViewer";
import FilterColumn from "./FilterColumn";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import Navbar from "react-bootstrap/lib/Navbar";

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			eventID: -1,
			rawRequest: ""
		};
		this.handleFilterChange = this.handleFilterChange.bind(this);
		this.handleRowSelection = this.handleRowSelection.bind(this);
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
	handleRowSelection(eventID, rawRequest) {
		this.setState({
			eventID: eventID,
			rawRequest: rawRequest
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
			<div>
				<Navbar>
					<Navbar.Header>
						<Navbar.Brand>
							<a href="#/">TRACY</a>
						</Navbar.Brand>
					</Navbar.Header>
				</Navbar>
				<Row>
					<Col md={12}>
						<div>
							<FilterColumn
								handleChange={this.handleFilterChange}
							/>
						</div>
					</Col>
				</Row>
				<Row>
					<Col md={12}>
						<TracerTable
							tracerFilters={tracerFilters}
							handleRowSelection={this.handleRowSelection}
						/>
					</Col>
				</Row>
				<Row>
					<Col md={12}>
						<DetailsViewer
							rawRequest={this.state.rawRequest}
							eventID={this.state.eventID}
							timingInterval={3000}
							contextFilters={contextFilters}
						/>
					</Col>
				</Row>
			</div>
		);
	}
}

export default App;
