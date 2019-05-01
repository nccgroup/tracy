import React, { Component } from "react";

export default class Screenshot extends Component {
  render() {
    return (
      <img
        className="tracy-screenshot"
        src={this.props.screenshot}
        title="tracy-screenshot"
        alt="tracy-screenshot"
      />
    );
  }
}
