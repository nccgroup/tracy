import React, { Component } from "react";
import InstallLinks from "./InstallLinks";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import Settings from "./Settings";

class Footer extends Component {
  render() {
    return (
      <Row className="link-row">
        <Col md={6}>
          <span>raw request</span>
        </Col>
        <Col md={4}>
          <span>raw output</span>
        </Col>
        <Col md={2}>
          <Row className="plugin-settings">
            <Col md={9}>
              <Settings />
            </Col>
            <Col md={3}>
              <InstallLinks />
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }
}

export default Footer;
