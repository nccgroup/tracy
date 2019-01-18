import React, { Component } from "react";
import HighlightedElement from "./HighlightedElement";
import Screenshot from "../containers/Screenshot";

export default class TracerInputDetails extends Component {
  render() {
    return (
      <div>
        <Screenshot screenshot={this.props.screenshot} />
        <HighlightedElement
          highlightString={this.props.highlightString}
          highlightOffset={-1}
          data={this.props.rawData}
          lang="http"
          title="raw request"
        />
      </div>
    );
  }
}
