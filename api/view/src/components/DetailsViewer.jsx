import React, { Component } from "react";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import EventDetails from "./EventDetails";
import TracerDetails from "./TracerDetails";
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
        <TracerDetails
          data={this.props.tracer.RawRequest}
          highlightString={this.props.tracer.TracerPayload}
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
      <Row id="details-views" className="details-viewer">
        <Col md={6} className="left-bottom-column">
          {leftColumn}
        </Col>
        <Col md={6} className="right-bottom-column">
          {rightColumn}
        </Col>
      </Row>
    );
  }
}
