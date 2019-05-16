import React, { Component } from "react";
import Screenshot from "../containers/Screenshot";
import HighLightedElement from "../containers/HighlightedElement";

export default class GeneratedMetaView extends Component {
  render = () => (
    <div className="generated-meta-vew">
      <Screenshot screenshot={this.props.tracer.Screenshot} />
      <HighLightedElement
        lang="http"
        highlightOffset={-1}
        highlightString={this.props.tracer.TracerPayload}
        data={this.props.tracer.RawRequest}
        title="raw request"
      />
    </div>
  );
}
