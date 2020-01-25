import React, { Component } from "react";
import Screenshot from "../containers/Screenshot";
import HighLightedElement from "../containers/HighlightedElement";

export default class Inputs extends Component {
  render = () => (
    <div className="inputs">
      <div className="frame tracy-screenshot-frame">
        <Screenshot screenshot={this.props.tracer.Screenshot} />
      </div>
      <div className="frame">
        <HighLightedElement
          lang="http"
          highlightOffset={0}
          highlightString={this.props.tracer.TracerPayload}
          data={this.props.request.RawRequest}
          title="raw request"
        />
      </div>
    </div>
  );
}
