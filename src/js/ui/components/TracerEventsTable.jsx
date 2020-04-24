/* global chrome */
import React, { Component } from "react";
import ArrowNavigationTable from "./ArrowNavigationTable";
import "react-table/react-table.css";
import { newTracyNotification } from "../../shared/notifications";
import { channel } from "../../shared/channel-cs";
import { rpc } from "../../shared/rpc";
import { filterTextNodes } from "../../shared/ui-helpers";

const r = rpc(channel);
export default class TracerEventsTable extends Component {
  componentDidMount() {
    this.refresh();
    setInterval(this.refresh, 5000);
    this.props.eventsLoading();
  }

  refresh = async () => {
    this.props.updateEvents(
      await r.getTracerEventsByPayload(this.props.selectedTracerPayload),
      this.props.selectedEventID,
      this.props.selectedEventTableIndex
    );
  };
  render = () => {
    if (this.props.loading) {
      this.refresh();
    }
    let data = this.props.events;
    if (this.props.filterTextNodes) {
      data = data.filter(filterTextNodes);
    }

    return (
      <div id="event" className="table-container table-container-events">
        <span className="filler" />
        <ArrowNavigationTable
          {...this.props}
          tableType="event"
          data={data}
          defaultSorted={[
            {
              id: "id",
              desc: true,
            },
          ]}
          defaultPageSize={10}
          columns={[
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
          ]}
        />
      </div>
    );
  };
}
