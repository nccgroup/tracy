import React from "react";
import HighlightedElement from "./HighlightedElement";
import { connect } from "react-redux";

const mapStateToProps = (state) => ({
  tracer:
    state.tracers
      .filter((t) => t.TracerPayload === state.selectedTracerPayload)
      .pop() || {},
  event: state.events.filter((e) => e.ID === state.selectedEventID).pop() || {},
  rawEvent: state.selectedEventRawEvent,
  loading: state.rawEventLoading,
});

const RawView = (props) => {
  if (props.loading) {
    return <div className="raw-view">Loading...</div>;
  }

  if (
    Object.keys(props.event).length === 0 ||
    Object.keys(props.tracer).length === 0
  ) {
    return <div></div>;
  }
  return (
    <HighlightedElement
      data={props.rawEvent}
      highlightString={props.tracer.TracerPayload}
      highlightOffset={props.event.RawEventIndex}
      lang={props.event.RawEventType.split("/")[1]}
      title="raw output"
    />
  );
};

export default connect(mapStateToProps)(RawView);
