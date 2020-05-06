import React, { Component } from "react";
import { Screenshot } from "./Screenshot";
import HighLightedElement from "./HighlightedElement";
import { connect } from "react-redux";
const mapStateToProps = (state) => {
  const curr = state.tracers.filter(
    (t) => t.TracerPayload === state.selectedTracerPayload
  );
  let t;
  if (curr.length > 0) {
    t = curr.pop();
  } else {
    t = {};
  }
  let r = {};
  if (t.Requests) {
    r = t.Requests.filter((r) => r.ID === state.selectedRequestID)[0] || {};
  }
  return { tracer: t, request: r };
};
class Inputs extends Component {
  render = () => (
    <div className="inputs">
      <div className="frame tracy-screenshot-frame">
        <Screenshot screenshot={this.props.tracer.Screenshot} />
      </div>
      <div className="frame">
        {Object.keys(this.props.request).length === 0 ? (
          <div></div>
        ) : (
          <HighLightedElement
            lang="http"
            highlightOffset={this.props.request.RawRequest.split("\n")
              .map((l, i) =>
                l
                  .toLowerCase()
                  .indexOf(this.props.tracer.TracerPayload.toLowerCase()) !== -1
                  ? i + 1
                  : null
              )
              .filter((l) => l !== null)
              .pop()}
            highlightString={this.props.tracer.TracerPayload}
            data={this.props.request.RawRequest}
            title="raw request"
          />
        )}
      </div>
    </div>
  );
}

export default connect(mapStateToProps)(Inputs);
