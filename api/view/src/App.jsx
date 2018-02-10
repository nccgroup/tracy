import React, { Component } from "react";
import TracerTable from "./TracerTable";
import DetailsViewer from "./DetailsViewer";
import FilterColumn from "./FilterColumn";
import DOMContextViewer from "./DOMContextViewer";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import Navbar from "react-bootstrap/lib/Navbar";

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			tracerID: -1,
			selectedEvent: "",
			rawRequest: ""
		};
		this.handleFilterChange = this.handleFilterChange.bind(this);
		this.handleRowSelection = this.handleRowSelection.bind(this);
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
	handleRowSelection(tracerID, rawRequest) {
		this.setState({
			tracerID: tracerID,
			rawRequest: rawRequest
		});
	}

	/* Called whenever a new event is select. */
	handleEventSelection(nSelectedEvent) {
		this.setState({
			selectedEvent: nSelectedEvent
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
					<Navbar>
						<Navbar.Header>
							<Navbar.Brand>
								<a href="#/">TRACY</a>
							</Navbar.Brand>
						</Navbar.Header>
					</Navbar>
					<Row>
						<Col md={12}>
							<FilterColumn
								className="filter-column"
								handleChange={this.handleFilterChange}
							/>
						</Col>
					</Row>
					<Row>
						<Col md={6}>
							<TracerTable
								tracerFilters={tracerFilters}
								handleRowSelection={this.handleRowSelection}
							/>
						</Col>
						<Col md={6}>
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
								selectedEvent={this.state.selectedEvent}
								timingInterval={3000}
							/>
						</Col>
					</Row>
				</Col>
			</Row>
		);
	}
}

export default App;
