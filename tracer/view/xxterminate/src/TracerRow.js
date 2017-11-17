import React from 'react';
import TracerEvents from './TracerEvents.js'
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';

class TracerRow extends React.Component {
	constructor(props) {
		super(props)
		this.state = { isHidden: false}
	}
	toggleEvents() {
		this.setState({
			isHidden: !this.state.isHidden
		})
	}
	render() {
		const hiddenClass = "menudown-icon glyphicon glyphicon-menu-down"
		const revealClass = "menudown-icon glyphicon glyphicon-menu-up"
		
		if (this.props.tracer.Events.length > 1) {
			return <div><Row className="show-grid tracer-row">
		      <Col xs={1} md={1}><div className="tracer-id">{this.props.tracer.ID}</div></Col>
		      <Col xs={2} md={2}><div className="tracer-string">{this.props.tracer.TracerString}</div></Col>
		      <Col xs={1} md={1}><div className="tracer-method">{this.props.tracer.Method}</div></Col>
		      <Col xs={7} md={7}><div className="tracer-url">{this.props.tracer.URL}</div></Col>
		      <Col xs={1} md={1}><span onClick={this.toggleEvents.bind(this)} className={this.state.isHidden ? hiddenClass: revealClass}></span></Col>
	    	</Row>
		    {!this.state.isHidden && 
		    	<TracerEvents 
		    		addHighlight={this.props.addHighlight}
		    		tracerString={this.props.tracer.TracerString}
		    		events={this.props.tracer.Events}/>
		    }</div>
		} else {
			return <div></div>;
		}
	}
}
export default TracerRow;