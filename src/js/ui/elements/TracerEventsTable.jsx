import React, { useEffect } from "react";
import ArrowNavigationTable from "./ArrowNavigationTable";
import "react-table/react-table.css";
import { channel } from "../../shared/channel-cs";
import { rpc } from "../../shared/rpc";
import { filterTextNodes } from "../../shared/ui-helpers";
import { connect } from "react-redux";
import {
  setRawEvent,
  addEvents,
  updateEvents,
  selectEvent,
  eventsLoading,
  rawEventLoading,
} from "../actions";

const mapStateToProps = (state) => ({
  refresh: state.eventsRefresh,
  loading: state.eventsLoading,
  events: state.events,
  selectedID: state.selectedEventID,
  selectedEventRawEvent: state.selectedEventRawEvent,
  lastSelectedTable: state.lastSelectedTable,
  selectedTracerPayload: state.selectedTracerPayload,
  filterResponses: state.httpResponsesFilter,
  filterTextNodes: state.textFilter,
});

const mapDispatchToProps = (dispatch) => ({
  setRawEvent: (rawEvent) => dispatch(setRawEvent(rawEvent)),
  addEvents: (events) => dispatch(addEvents(events)),
  updateEvents: (events) => dispatch(updateEvents(events)),
  selectRow: (id, clicked) => dispatch(selectEvent(id, clicked)),
  eventsLoading: () => dispatch(eventsLoading()),
  rawEventLoading: () => dispatch(rawEventLoading()),
});

const r = rpc(channel);
const defaultSort = [
  {
    id: "ID",
    desc: true,
  },
];
const columns = [
  {
    Header: "observed outputs",
    columns: [
      { Header: "id", accessor: "ID", width: 45 },
      { Header: "url", accessor: "EventURL" },
      {
        Header: "type",
        accessor: "EventType",
      },
      { Header: "location", accessor: "HTMLLocationType" },
      { Header: "node", accessor: "HTMLNodeType" },
      {
        Header: "sev",
        accessor: "Severity",
        width: 45,
      },
    ],
  },
];

let reset;
const setReset = (r) => (reset = r);
const TracerEventsTable = (props) => {
  const pollForEvents = async () => {
    const events = await r.getTracerEventsByPayload(
      props.selectedTracerPayload
    );

    props.updateEvents(events);
  };

  // when the component mounts, get a list of updated events
  useEffect(() => {
    if (!props.selectedTracerPayload) {
      return;
    }
    props.eventsLoading();
  }, []);
  useEffect(() => {
    if (props.loading && reset) {
      reset();
      pollForEvents();
    }
    if (props.refresh) {
      pollForEvents();
    }
  }, [props.loading, props.refresh]);

  let data = props.events;
  if (props.filterTextNodes) {
    data = data.filter(filterTextNodes);
  }
  return (
    <div id="event" className="table-container table-container-events">
      <span className="filler" />
      <ArrowNavigationTable
        {...props}
        selectRow={props.selectRow}
        tableType="event"
        reset={setReset}
        data={data}
        defaultSorted={defaultSort}
        defaultPageSize={10}
        columns={columns}
      />
    </div>
  );
};
export default connect(mapStateToProps, mapDispatchToProps)(TracerEventsTable);
