import React from 'react';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

class TracerEventData extends React.Component {
	render() {
		const highlights = this.props.slices.map((slice, index) =>
			<span key={index}><code>{slice}</code><code className="highlight">{this.props.tracerString}</code></span>
		);
		return <Row className="tracer-event-data-holder">
			<Col xs={12} md={12} className="tracer-event-data">{highlights}<code>{this.props.end}</code></Col>
		</Row>
	}
}
export default TracerEventData;