import React from 'react';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

class TracerEventDataExpanded extends React.Component {
	constructor(props) {
		super(props);
		this.accumulateHighlight = this.accumulateHighlight.bind(this);
		this.state = {
			data: this.props.data,
			slices: [], 
			end: []
		};
		this.highlights = [];
	}
	accumulateHighlight(e) {
		this.highlights.push(e);
	}
	componentDidMount() {
		/* Start at the beginning of the string. */
		var currentIndex = 0;
		var newSlices = [];
		while(true) {
			/* Get the reference to the next instance of the tracer string. */
			if (this.state.data) {
				var tracerStartNumber = this.state.data.indexOf(this.props.tracerString, currentIndex);
				if (tracerStartNumber === -1) {
					break;
				}
				
				var slice = this.state.data.substring(currentIndex, tracerStartNumber);
				newSlices.push(slice);

				/* Set the index to the end of the first tracer string we find. */
				currentIndex = tracerStartNumber + this.props.tracerString.length;
			} else {
				/* Update the state. */
				this.setState({
					data: this.props.event.Data,
					slices: newSlices,
					end: "",
					tracerString: this.state.tracerString
				});
				return;
			}
		}

		/* Update the state. */
		this.setState({
			data: this.props.data,
			slices: newSlices,
			end: this.state.data.substring(currentIndex),
			tracerString: this.state.tracerString
		});
	}
	render() {
		var highlightElements = this.state.slices.map((slice, index) =>
			<span
				key={index}>
				{slice} 
					<code
						className="highlight">
						{this.props.tracerString}
					</code>
			</span>
		);
		const revealClass = "tracer-event-data";
		return (<Row className={revealClass + " tracer-event"}>
					<Col 
						md={12}>
						<pre>{highlightElements}	
						{this.state.end}</pre>
					</Col>
				</Row>);
	}
}
export default TracerEventDataExpanded;