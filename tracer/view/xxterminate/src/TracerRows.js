import React from 'react';
import TracerRow from './TracerRow.js'
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

class TracerRows extends React.Component {
	sort(field){
    	this.props.sortBy(field);
  	}
	render() {
		const tracers = this.props.tracers.map((tracer) => (
				<TracerRow 
					addHighlight={this.props.addHighlight}
					key={tracer.ID} 
					tracer={tracer} />
			))

		return <div>
		<Row className="tracer-heading">
			<Col xs={1} md={1}><div onClick={this.sort.bind(this,'ID')}>ID</div></Col>
			<Col xs={2} md={2}><div onClick={this.sort.bind(this,'TracerString')}>TracerString</div></Col>
			<Col xs={1} md={1}><div onClick={this.sort.bind(this,'Method')}>Method</div></Col>
			<Col xs={8} md={8}><div onClick={this.sort.bind(this,'URL')}>URL</div></Col>
		</Row>{tracers}</div>
	}
}

export default TracerRows;