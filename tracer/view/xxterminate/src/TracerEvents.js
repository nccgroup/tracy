import React from 'react';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';
import TracerEvent from './TracerEvent.js'

class TracerEvents extends React.Component {
	constructor(props) {
		super(props);
		this.sortBy = this.sortBy.bind(this);
		this.state = {events: this.props.events};
	}
	sortBy(field) {
	    function asc(a,b) {
	      if (a[field] < b[field])
	        return -1;
	      if (a[field] > b[field])
	        return 1;
	      return 0;
	    }

	    function desc(a,b) {
	      if (a[field] > b[field])
	        return -1;
	      if (a[field] < b[field])
	        return 1;
	      return 0;
	    }

	    var sortedEvents;
	    if (this.state.sortDir) {
	    	sortedEvents = this.state.events.sort(asc);
	    } else {
	    	sortedEvents = this.state.events.sort(desc);
	    }
	    this.setState({
	      events: sortedEvents,
	      sortDir: !this.state.sortDir
	    });
  	}
	render() {
		const header = 
			<Row className="tracer-event-header">
				<Col 
					md={2} 
					onClick={this.sortBy.bind(this,'ID')} 
					className="tracer-event-id">Tracer Event ID
				</Col>
				<Col 
					md={2} 
					onClick={this.sortBy.bind(this,'EventType')} 
					className="tracer-event-type">Tracer Event Type
				</Col>
				<Col
					md={8} 
					onClick={this.sortBy.bind(this,'Location')} 
					className="tracer-event-location">Tracer Event Location
				</Col>
			</Row>
		const hits = this.state.events.map((event) =>
			<TracerEvent 
				addHighlight={this.props.addHighlight}
				key={event.ID} 
				event={event} 
				tracerString={this.props.tracerString} />
		);
		return <div>{header}{hits}</div>;
	}
}
export default TracerEvents;