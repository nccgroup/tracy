import React, { PureComponent } from "react";
import HighlightedElement from "./HighlightedElement";
import PropertiesTable from "../containers/PropertiesTable";

class EventDetails extends PureComponent {
  render() {
    return (
      <div>
        <HighlightedElement
          data={this.props.data}
          highlightString={this.props.highlightString}
          highlightOffset={this.props.highlightOffset}
          lang={this.props.lang}
          title="raw output"
        />
        <PropertiesTable />
      </div>
    );
  }
}
export default EventDetails;
