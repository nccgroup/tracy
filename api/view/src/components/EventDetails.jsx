import React, { PureComponent } from "react";
import HighlightedElement from "./HighlightedElement";

class EventDetails extends PureComponent {
  render() {
    return (
      <HighlightedElement
        data={this.props.data}
        highlightString={this.props.highlightString}
        highlightOffset={this.props.highlightOffset}
        lang={this.props.lang}
        title="raw output"
      />
    );
  }
}
export default EventDetails;
