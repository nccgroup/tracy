import React, { Component } from "react";
import EventDetails from "../containers/EventDetails";
import { isEmpty } from "../utils/index";
export default class RawView extends Component {
  render = () => {
    let eventDetails;
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
      eventDetails = (
        <EventDetails
          data={data}
          highlightString={this.props.tracer.TracerPayload}
          highlightOffset={this.props.event.RawEventIndex}
          lang={lang}
        />
      );
    }
    return <div className="raw-view">{eventDetails}</div>;
  };
}
