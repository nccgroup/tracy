import React, { Component } from "react";
import Col from "react-bootstrap/lib/Col";
import TracyLogo from "./TracyLogo";

class Header extends Component {
	/* This is a static component that should never update. */
	shouldComponentUpdate(nextProps, nextState) {
		return false;
	}

	render() {
		return (
			<Col md={this.props.width} className="brand">
				<TracyLogo width={25} />
				<span className="logo-title">tracy</span>
			</Col>
		);
	}
}

export default Header;
