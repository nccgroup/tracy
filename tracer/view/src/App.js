import React, { Component } from 'react';
import MainTable from './MainTable';
import FilterColumn from './FilterColumn';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

class App extends Component {
	constructor(props) {
		super(props);
		// Filter functions that can be used to show and reveal types of events
		// globally.
		this.state = {};
		this.handleChange = this.handleChange.bind(this);
	}

	handleChange(evt, filter) {
		this.setState(function(prevState, props) {
			let ret = {};
		 	ret[evt] = filter;
			return ret;
		});
	}

	render() {
		// TODO: these probably don't need to be configurable
		// Enum to human-readable structure to translate the various DOM contexts.
		const locationTypes = {
		  0: "attribute name",
		  1: "text",
		  2: "node name",
		  3: "attribute value"
		};

		// Enum to human-readable structure to translate the different severity ratings. 
		const severity = {
		  0: "unexploitable",
		  1: "suspicious",
		  2: "probable",
		  3: "exploitable"
		};

		const contextKeys = ["responses", "exploitable", "archivedContexts", "text"];
		const tracerKeys = ["archivedTracers", "inactive"];

		const contextFilters = Object.keys(this.state).filter(function(n){
			return contextKeys.includes(n) && this.state[n];
		}.bind(this)).map(function(n) { 
			return this.state[n] 
		}.bind(this));
		
		const tracerFilters = Object.keys(this.state).filter(function(n){
			return tracerKeys.includes(n) && this.state[n];
		}.bind(this)).map(function(n) {
			return this.state[n];
		}.bind(this));

		return (
			<Row>
				<Col
					md={2}>
					<FilterColumn
						handleChange={this.handleChange} />
				</Col>
				<Col
					md={10}>
					<MainTable 
						severity={severity} 
						locationTypes={locationTypes}
						contextFilters={contextFilters}
						tracerFilters={tracerFilters} />
				</Col>
			</Row>
		)
	}
}

export default App;