import React, { Component } from "react";
import EventDetails from "./EventDetails";
import TracerInputDetails from "./TracerInputDetails";
import { isEmpty, occurrences } from "../utils";

export default class DetailsViewer extends Component {
  defaultLeft = (
    <pre className="raw-data">
      Click one of the tracers above to list all of its destinations on the
      right.
    </pre>
  );
  defaultRight = (
    <pre className="raw-data">
      Click one of the tracer events above to see the tracer's destination.
    </pre>
  );

  render() {
    let leftColumn = this.defaultLeft;
    let rightColumn = this.defaultRight;
    if (!isEmpty(this.props.tracer)) {
      leftColumn = (
        <TracerInputDetails
          screenshot={this.props.tracer.Screenshot}
          highlightString={this.props.tracer.Payload}
          rawData={this.props.tracer.RawRequest}
        />
      );
    }

    if (!isEmpty(this.props.event)) {
      let lang;
      let data;
      try {
        data = JSON.stringify(
          JSON.parse(this.props.event.RawEvent),
          null,
          "  "
        );
        lang = "json";
      } catch (e) {
        data = this.props.event.RawEvent;
        lang = "html";
      }

      rightColumn = (
        <EventDetails
          data={data}
          highlightString={this.props.tracer.TracerPayload}
          highlightOffset={this.props.event.RawEventIndex}
          lang={lang}
        />
      );
    }

    return (
      <div>
        {leftColumn}
        {rightColumn}
      </div>
    );
  }
}
