import React, { Component } from "react";
import HighlightedElement from "./HighlightedElement";

class TracerDetails extends Component {
  render() {
    console.log("ME!", this.props);
    return (
      <HighlightedElement
        highlightString={this.props.highlightString}
        highlightOffset={-1}
        data={this.props.data}
        lang="http"
        title="raw request"
      />
    );
  }
}

export default TracerDetails;
