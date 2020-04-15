import React, { Component } from "react";
import EventDetails from "../containers/EventDetails";
import { isEmpty } from "lodash";
export default class RawView extends Component {
  render = () => {
    if (isEmpty(this.props.event)) {
      return <div className="raw-view" />;
    }
    let lang;
    let data = "...\n...\n";
    try {
      data += JSON.stringify(JSON.parse(this.props.event.RawEvent), null, "  ");
      lang = "json";
    } catch (e) {
      data += this.props.event.RawEvent;
      lang = "html";
    }
    data += "\n...\n...";
    return (
      <EventDetails
        data={data}
        highlightString={this.props.tracer.TracerPayload}
        highlightOffset={this.props.event.RawEventIndex}
        lang={lang}
      />
    );
  };
}
