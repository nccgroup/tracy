import React from 'react';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

class TracerEventDataExpanded extends React.Component {
	constructor(props) {
		super(props);
		this.accumulateHighlight = this.accumulateHighlight.bind(this);
		this.state = {
			slices: [], 
			end: [],
			hidden: this.props.hidden
		};
		this.highlights = [];
	}
	accumulateHighlight(e) {
		this.highlights.push(e);
	}
	componentWillReceiveProps(nextProps) {
		var highlightElements = nextProps.slices.map((slice, index) =>
			<span
				ref={this.props.addHighlight}
				key={index}>
				<code>{slice}</code>
				<code 
					className="highlight">{this.props.tracerString}</code>
			</span>
		);
		this.setState({
			slices: highlightElements,
			end: nextProps.end,
			hidden: nextProps.hidden
		});
	}
	render() {
		const hiddenClass = "hidden tracer-event-data";
		const revealClass = "tracer-event-data";
		return (<Row className={this.state.hidden ? hiddenClass + " tracer-event" : revealClass + " tracer-event"}>
					<Col 
						md={12}>
						{this.state.slices}
						<code>{this.state.end}</code>
					</Col>
				</Row>);
	}
}
export default TracerEventDataExpanded;