import React from 'react';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

class TracerContext extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		var contexts = this.props.contexts.map((context) => 
			<div
				key={context.ID}>
				<Row 
					className="event-context">
					<Col 
						md={4} 
						className="event-context-id">{context.ID}
					</Col>
					<Col 
						md={4} 
						className="event-context-location-type">{context.Location}
					</Col>
					<Col 
						md={4} 
						className="event-context-node-name">{context.NodeName}
					</Col>
				</Row>
				<Row
					className="event-data">
					<Col 
						md={12} 
						className="event-context-data">
						<code>{context.Context}</code>
					</Col>
				</Row>
			</div>
		);
		return (
			<div>
				<Row 
					className="event-context">
					<Col 
						md={4} 
						className="event-context-id">ID
					</Col>
					<Col 
						md={4} 
						className="event-context-location-type">Location Type
					</Col>
					<Col 
						md={4} 
						className="event-context-node-name">Node Type
					</Col>
				</Row>
				{contexts}
			</div>
		);
	}
}

export default TracerContext;