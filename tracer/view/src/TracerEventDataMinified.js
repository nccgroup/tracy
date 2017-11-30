import React from 'react';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

class TracerEventDataMinified extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			end: "", 
			slices: [], 
			tracerString: this.props.tracerString,
			hidden: this.props.hidden
		}
	}
	componentWillReceiveProps(nextProps) {
		/* Number of characters before and after the tracer string occurrence. */
		var buffer = 25;
		var highlightElements = nextProps.slices.map((slice, index) =>
			<span
				ref={this.props.addHighlight}
				key={index}>
				<code>{slice.substring(slice.length-buffer, slice.length)}</code>
				<code
					className="highlight">{nextProps.tracerString}
				</code>
			</span>
		);
		var cutEnd = nextProps.end.substring(0, buffer);
		this.setState({
			end: cutEnd, 
			slices: highlightElements,
			tracerString: nextProps.tracerString,
			hidden: nextProps.hidden
		});
	}
	render() {
		const hiddenClass = "hidden tracer-event-data";
		const revealClass = "tracer-event-data";
		return (<Row 
					className={this.state.hidden ? hiddenClass + " tracer-event" : revealClass + " tracer-event"}>
					<Col 
						md={12}>
						{this.state.slices}
						<code>{this.state.end}</code>
					</Col>
				</Row>);
	}
}
export default TracerEventDataMinified;