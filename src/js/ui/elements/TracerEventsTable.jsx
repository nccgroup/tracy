import React, { useEffect } from "react";
import ArrowNavigationTable from "./ArrowNavigationTable";
import "react-table/react-table.css";
import { channel } from "../../shared/channel-cs";
import { rpc } from "../../shared/rpc";
import { filterTextNodes } from "../../shared/ui-helpers";
import { wrap, omit } from "lodash";
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
  selectedEventID: state.selectedEventID,
  selectedEventRawEvent: state.selectedEventRawEvent,
  selectedEventTableIndex: state.selectedEventTableIndex,
  lastSelectedTable: state.lastSelectedTable,
  selectedTracerPayload: state.selectedTracerPayload,
  filterResponses: state.httpResponsesFilter,
  filterTextNodes: state.textFilter,
});

const mapDispatchToProps = (dispatch) => ({
  setRawEvent: (rawEvent) => dispatch(setRawEvent(rawEvent)),
  addEvents: (events) => dispatch(addEvents(events)),
  updateEvents: (events, eventID, tableID, rawEvent) =>
    dispatch(updateEvents(events, eventID, tableID, rawEvent)),
  selectRow: (index, id, clicked, _) =>
    dispatch(selectEvent(index, id, clicked)),
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
  const loadRawEvent = async (eventID) => {
    const rawEventBlobURL = await r.getRawEvent(eventID);
    const resp = await fetch(rawEventBlobURL);
    const blob = await resp.blob();
    URL.revokeObjectURL(rawEventBlobURL);
    return await blob.text();
  };

  const refresh = async () => {
    const events = await r.getTracerEventsByPayload(
      props.selectedTracerPayload
    );

    let eventID = -1;
    let rawEvent = "";
    if (events.length > 0) {
      eventID =
        props.selectedEventID === -1
          ? events[events.length - 1].ID
          : props.selectedEventID;

      rawEvent = await loadRawEvent(eventID);
    }
    props.updateEvents(
      events,
      eventID,
      props.selectedEventTableIndex,
      rawEvent
    );
  };

  // when the component mounts, get a list of updated events
  useEffect(() => {
    refresh();
  }, []);

  // when the tracer payload changes, reset the table state
  useEffect(() => {
    if (reset) reset();
  }, [props.selectedTracerPayload]);

  // if the top level component calls for us to refresh
  if (props.refresh) {
    refresh();
  }
  // if we are loading events normally
  if (props.loading) {
    refresh();
  }
  let data = props.events;
  if (props.filterTextNodes) {
    data = data.filter(filterTextNodes);
  }

  const selectRow = wrap(
    props.selectRow,
    async (selectRow, index, id, clicked) => {
      if (id === props.selectedEventID) {
        return;
      }
      props.rawEventLoading();
      const re = await loadRawEvent(id);
      props.setRawEvent(re);
      selectRow(index, id, clicked);
    }
  );

  const filteredProps = omit(props, ["selectRow"]);
  return (
    <div id="event" className="table-container table-container-events">
      <span className="filler" />
      <ArrowNavigationTable
        {...filteredProps}
        selectRow={selectRow}
        tableType="event"
        data={data}
        setReset={setReset}
        defaultSorted={defaultSort}
        defaultPageSize={10}
        columns={columns}
      />
    </div>
  );
};
export default connect(mapStateToProps, mapDispatchToProps)(TracerEventsTable);
