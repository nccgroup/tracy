import React, { Component } from "react";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";

export default class Screenshot extends Component {
  render() {
    return (
      <img
        className="tracy-screenshot"
        src={this.props.screenshot}
        title="tracy-screenshot"
      />
    );
  }
}
