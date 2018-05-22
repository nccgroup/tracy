import React, { Component } from "react";
import InstallLinks from "./InstallLinks";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";

class Footer extends Component {
	/* This is a static component that shouldn't update. */
	shouldComponentUpdate(nextProps, nextState) {
		return false;
	}
	render() {
		return (
			<Row className="link-row">
				<Col md={6}>
					<span>raw request</span>
				</Col>
				<Col md={5}>
					<span>raw output</span>
				</Col>
				<Col md={1}>
					<Row>
						<Col md={5} />
						<Col md={5}>
							<InstallLinks />
						</Col>
						<Col md={2} />
					</Row>
				</Col>
			</Row>
		);
	}
}

export default Footer;
