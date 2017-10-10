import React from 'react';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';
import TracerEventData from './TracerEventData.js'

class TracerEvent extends React.Component {
	constructor(props){
		super(props);
		this.state = {data: this.props.event.Data, slices: [], end: ""}
	}
	componentDidMount() {
		/* Start at the beginning of the string. */
		var currentIndex = 0;
		var slices = [];
		while(true) {
			/* Get the reference to the next instance of the tracer string. */
			var tracerStartNumber = this.state.data.indexOf(this.props.tracerString, currentIndex);
			if (tracerStartNumber === -1) {
				break;
			}
			
			var slice = this.state.data.substring(currentIndex, tracerStartNumber);
			slices.push(slice);

			/* Set the index to the end of the first tracer string we find. */
			currentIndex = tracerStartNumber + this.props.tracerString.length;
		}

		/* Update the state. */
		this.setState({
			data: this.props.event.Data,
			slices: slices,
			end: this.state.data.substring(currentIndex)
		});
	}
	render() {
		return (<Row className="tracer-event">
			<Col xs={2} md={2} className="tracer-event-id">{this.props.event.ID}</Col>
			<Col xs={2} md={2} className="tracer-event-data">{this.props.event.EventType}</Col>
			<Col xs={8} md={8} className="tracer-event-location">{this.props.event.Location}</Col>
			<TracerEventData tracerString={this.props.tracerString} slices={this.state.slices} end={this.state.end}/>
		</Row>);
	}
}
export default TracerEvent;