import React from 'react';

class TracerNavigation extends React.Component {
	constructor(props){
		super(props);
	}
	render() {
		return (
			<div className="navigation-arrows">
				<div onClick={this.props.goToPreviousReference} className="glyphicon glyphicon-arrow-up"></div>
				<br></br>
				<div onClick={this.props.goToNextReference} className="glyphicon glyphicon-arrow-down"></div>
			</div>);
	}
}
export default TracerNavigation;