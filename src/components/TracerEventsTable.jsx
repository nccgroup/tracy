/* global chrome */
import React, { Component } from "react";
import ArrowNavigationTable from "./ArrowNavigationTable";
import "react-table/react-table.css";
import * as utils from "../utils";

export default class TracerEventsTable extends Component {
  componentDidMount() {
    const port = chrome.runtime.connect({ name: "TracerEventsTable" });
    port.onMessage.addListener(msg => {
      switch (Object.keys(msg).pop()) {
        case "addEvents":
          const allEvents = Object.values(msg).pop().events;
          const selectedEvents = allEvents.filter(
            e => e.TracerPayload === this.props.selectedTracerPayload
          );
          const highSevEvents = allEvents.filter(e => e.Severity >= 2);
          if (highSevEvents.length > 0) {
            highSevEvents.map(s =>
              utils.newTracyNotification(
                this.props.selectedTracerPayload,
                s,
                () => console.log("clicked!")
              )
            );
          }
          this.props.addEvents(selectedEvents);
          break;
        default:
          break;
      }
    });
    port.onDisconnect.addListener(() =>
      console.log("disconnected", chrome.runtime.lastError)
    );
    this.props.eventsLoading();
  }

  refresh = async () => {
    this.props.updateEvents(
      await utils.getTracerEvents(this.props.selectedTracerPayload),
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
      data = data.filter(utils.filterTextNodes);
    }

    return (
      <div className="table-container table-container-events">
        <span className="filler" />
        <ArrowNavigationTable
          {...this.props}
          tableType="event"
          data={data}
          defaultSorted={[
            {
              id: "id",
              desc: true
            }
          ]}
          loading={
            this.props.loading || this.props.selectedTracerPayload === ""
          }
          loadingText={
            this.props.loading
              ? "loading..."
              : "click a tracer for more details"
          }
          defaultPageSize={10}
          columns={[
            {
              Header: "observed outputs",
              columns: [
                { Header: "id", accessor: "ID", width: 45 },
                { Header: "url", accessor: "EventURL" },
                {
                  Header: "type",
                  accessor: "EventType"
                },
                { Header: "location", accessor: "HTMLLocationType" },
                { Header: "node", accessor: "HTMLNodeType" },
                {
                  Header: "sev",
                  accessor: "Severity",
                  width: 45
                }
              ]
            }
          ]}
        />
      </div>
    );
  };
}
