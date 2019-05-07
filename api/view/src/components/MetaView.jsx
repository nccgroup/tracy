import React, { Component } from "react";
import Screenshot from "../containers/Screenshot";
import PropertiesTable from "../containers/PropertiesTable";
import HighLightedElement from "../containers/HighlightedElement";
export default class MetaView extends Component {
  render = () => {
    return (
      <div className="meta-view">
        <Screenshot screenshot={this.props.tracer.Screenshot} />
        <HighLightedElement
          lang="http"
          highlightOffset={-1}
          highlightString={this.props.tracer.TracerPayload}
          data={this.props.tracer.RawRequest}
          title="raw request"
        />
        <PropertiesTable />
      </div>
    );
  };
}
