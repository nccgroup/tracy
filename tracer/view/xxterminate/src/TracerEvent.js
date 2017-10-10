import React from 'react';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

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
			if (tracerStartNumber == -1) {
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
		const highlights = this.state.slices.map((slice) =>
			<span><code>{slice}</code><span className="highlight">{this.props.tracerString}</span></span>
		);
		return (
		<Row className="tracer-event">
			<Col xs={1} md={1} className="tracer-event-id">{this.props.event.ID}</Col>
			<Col xs={1} md={1} className="tracer-event-data">{this.props.event.EventType}</Col>
			<Col xs={4} md={4} className="tracer-event-location">{this.props.event.Location}</Col>
			<Col xs={6} md={6} className="tracer-event-type">
				{highlights}<code>{this.state.end}</code>
			</Col>
		</Row>);
	}
}
export default TracerEvent;