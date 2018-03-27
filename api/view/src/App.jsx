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
			tracer: {},
			event: {}
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
	handleTracerSelection(nTracer, isSelected) {
		if (isSelected) {
			this.setState({
				tracer: nTracer,
				event: {}
			});
		} else {
			this.setState({
				tracer: {},
				event: {}
			});
		}
	}

	/* Called whenever a new event is select. */
	handleEventSelection(nEvent, isSelected) {
		if (isSelected) {
			this.setState({
				event: nEvent
			});
		} else {
			this.setState({
				event: {}
			});
		}
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
						<Col md={4} className="filter-container">
							<FilterColumn
								handleChange={this.handleFilterChange}
							/>
						</Col>
						<Col md={4}>
							<div className="title">Tracy</div>
						</Col>
						<Col md={4} />
					</Row>
					<Row className="tables-row">
						<Col md={6} className="left-top-column">
							<TracerTable
								tracerFilters={tracerFilters}
								handleTracerSelection={
									this.handleTracerSelection
								}
							/>
						</Col>
						<Col md={6} className="right-top-column">
							<DOMContextViewer
								events={this.state.events}
								tracer={this.state.tracer}
								handleEventSelection={this.handleEventSelection}
								contextFilters={contextFilters}
							/>
						</Col>
					</Row>
					<Row className="raw-row">
						<Col className="raw-column" md={12}>
							<DetailsViewer
								tracer={this.state.tracer}
								event={this.state.event}
							/>
						</Col>
					</Row>
				</Col>
			</Row>
		);
	}
}

export default App;
