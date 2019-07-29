import React, { Component } from "react";

export default class Screenshot extends Component {
  render() {
    if (this.props.screenshot) {
      return (
        <img
          className="tracy-screenshot"
          src={this.props.screenshot}
          title="tracy-screenshot"
          alt="tracy-screenshot"
        />
      );
    }
    return <span>no screenshot available...</span>;
  }
}
