import React from 'react';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';
import TracerEventDataExpanded from './TracerEventDataExpanded.js'
import TracerEventDataMinified from './TracerEventDataMinified.js'

class TracerEvent extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			data: this.props.event.Data, 
			slices: [], 
			end: "", 
			isMinified: true,
			tracerString: this.props.tracerString}
	}
	componentWillReceiveProps(nextProps) {
		this.setState({
			data: nextProps.event.Data, 
			slices: this.state.slices, 
			end: this.state.end, 
			isMinified: this.state.isMinified,
			tracerString: nextProps.tracerString});
	}
	toggleEvents() {
		this.setState({
			isMinified: !this.state.isMinified
		})
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
			data: this.props.event.Data,
			slices: newSlices,
			end: this.state.data.substring(currentIndex),
			tracerString: this.state.tracerString
		});
	}
	render() {
		const hiddenMenuClass = "glyphicon glyphicon-menu-down"
		const revealMenuClass = "glyphicon glyphicon-menu-up"

		return (<div>
					<Row 
						className="tracer-event">
						<Col 
							md={2} 
							className="tracer-event-id">{this.props.event.ID}
						</Col>
						<Col 
							md={2} 
							className="tracer-event-data">{this.props.event.EventType}
						</Col>
						<Col 
							md={7} 
							className="tracer-event-location">{this.props.event.Location}
						</Col>
						<Col md={1}>
							<span
								onClick={this.toggleEvents.bind(this)} 
								className={this.state.isMinified ? hiddenMenuClass: revealMenuClass}>
							</span>
						</Col>
					</Row>
					<TracerEventDataMinified
						addHighlight={this.props.addHighlight}
						tracerString={this.state.tracerString} 
						slices={this.state.slices}
						end={this.state.end}
						hidden={!this.state.isMinified}/>
					<TracerEventDataExpanded 
						addHighlight={this.props.addHighlight}
						tracerString={this.state.tracerString} 
						slices={this.state.slices} 
						end={this.state.end}
						hidden={this.state.isMinified}/>
				</div>);
	}
}
export default TracerEvent;