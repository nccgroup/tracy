import React from "react";
import HighlightedElement from "./HighlightedElement";
import { connect } from "react-redux";
import { setRawEvent } from "../actions/index";
import { channel } from "../../shared/channel-cs";
import { rpc } from "../../shared/rpc";
const r = rpc(channel);

const mapStateToProps = (state) => {
  const selectedEvent = state.events
    .filter((e) => e.ID === state.selectedEventID)
    .pop();
  return {
    tracerPayload: selectedEvent ? selectedEvent.TracerPayload : null,
    selectedEventID: state.selectedEventID,
    instance: selectedEvent ? selectedEvent.RawEventIndex : null,
    rawEvent: state.selectedEventRawEvent,
    type: selectedEvent ? state.selectedEventRawEventType : null,
    loading: state.rawEventLoading,
  };
};
const mapDispatchToProps = (dispatch) => ({
  setRawEvent: (rawEvent, type) => dispatch(setRawEvent(rawEvent, type)),
});

const RawView = (props) => {
  const loadRawEvent = async (eventID) => {
    const rawEventBlobURL = await r.getRawEvent(eventID);
    const resp = await fetch(rawEventBlobURL);
    const blob = await resp.blob();
    URL.revokeObjectURL(rawEventBlobURL);
    const rawEvent = await blob.text();
    props.setRawEvent(rawEvent, blob.type);
  };

  if (props.loading) {
    loadRawEvent(props.selectedEventID);
    return <div className="raw-view">Loading...</div>;
  }

  // no tracer is selected
  else if (props.selectedEventID === -1) {
    return <div className="raw-view"></div>;
  }
  return (
    <HighlightedElement
      data={props.rawEvent}
      highlightString={props.tracerPayload}
      highlightOffset={props.instance}
      lang={props.type}
      title="raw output"
    />
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(RawView);
