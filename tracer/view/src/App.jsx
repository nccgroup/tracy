import React, { Component } from 'react';
import MainTable from './MainTable';
import FilterColumn from './FilterColumn';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';
import Nav from 'react-bootstrap/lib/Nav';
import Navbar from 'react-bootstrap/lib/Navbar';
import NavItem from 'react-bootstrap/lib/NavItem';

class App extends Component {
	constructor(props) {
		super(props)
		// Filter functions that can be used to show and reveal types of events
		// globally.
		this.state = {}
		this.handleChange = this.handleChange.bind(this)
	}

	handleChange(evt, filter) {
		this.setState( (prevState, props) => {
			let ret = {}
		 	ret[evt] = filter
			return ret
		})
	}

	render() {
		// Enum to human-readable structure to translate the various DOM contexts.
		const locationTypes = {
		  0: "attribute name",
		  1: "text",
		  2: "node name",
		  3: "attribute value",
		  4: "comment block"
		}

		// Enum to human-readable structure to translate the different severity ratings. 
		const severity = {
		  0: "unexploitable",
		  1: "suspicious",
		  2: "probable",
		  3: "exploitable"
		}

		const contextKeys = [
			"responses", 
			"exploitable", 
			"archivedContexts", 
			"text"
		]

		const tracerKeys = [
			"archivedTracers", 
			"inactive"
		]

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
			<div>
			<Navbar>
			    <Navbar.Header>
			      <Navbar.Brand>
			        <a href="#/">TRACER</a>
			      </Navbar.Brand>
			    </Navbar.Header>
			    <Nav>
			      <NavItem eventKey={1} href="#/events">EVENTS</NavItem>
			      <NavItem eventKey={2} href="#/settings">SETTINGS</NavItem>
			    </Nav>
			</Navbar>
			<Row>
				<Col
					md={12}>
					<div>
						<FilterColumn
							handleChange={this.handleChange} />
					</div>
				</Col>
			</Row>
			<Row>
				<Col
					md={12}>
					<MainTable 
						severity={severity} 
						locationTypes={locationTypes}
						contextFilters={contextFilters}
						tracerFilters={tracerFilters} />
				</Col>
			</Row>
			</div>
		)
	}
}

export default App;