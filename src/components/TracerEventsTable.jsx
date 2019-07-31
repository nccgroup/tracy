/* global chrome */
import React, { Component } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import * as utils from "../utils";

export default class TracerEventsTable extends Component {
  componentDidMount() {
    const port = chrome.runtime.connect({ name: "TracerEventsTable" });
    port.onMessage.addListener(msg => {
      switch (Object.keys(msg).pop()) {
        case "addEvents":
          const events = Object.values(msg)
            .pop()
            .events.filter(
              e => e.TracerPayload === this.props.selectedTracerPayload
            );
          this.props.addEvents(events);
          break;
        default:
          break;
      }
    });
    port.onDisconnect.addListener(() => console.log("disconnected"));
    this.refresh();

    utils.createKeyDownHandler(
      "event",
      () => this.props.lastSelectedTable,
      () =>
        this.props.selectEvent(
          utils.mod(
            this.props.selectedEventTableIndex - 1,
            this.props.events.length
          ),
          -1,
          false
        ),
      () =>
        this.props.selectEvent(
          utils.mod(
            this.props.selectedEventTableIndex + 1,
            this.props.events.length
          ),
          -1,
          false
        )
    );
  }
  refresh = async () => {
    this.props.updateEvents(
      await utils.getTracerEvents(this.props.selectedTracerPayload)
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
        <ReactTable
          className="grow-table"
          data={data}
          showPageSizeOptions={false}
          showPageJump={false}
          loading={
            this.props.loading || this.props.selectedTracerPayload === ""
          }
          loadingText={
            this.props.loading
              ? "loading..."
              : "click a tracer for more details"
          }
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
          getTrProps={(state, rowInfo, column, instance) => {
            if (rowInfo) {
              let classname = "";
              switch (rowInfo.row.Severity) {
                case 1:
                  classname = "suspicious";
                  break;
                case 2:
                  classname = "probable";
                  break;
                case 3:
                  classname = "exploitable";
                  break;
                default:
                  classname = "unexploitable";
              }

              if (rowInfo.viewIndex === this.props.selectedEventTableIndex) {
                classname += " row-selected";
                if (this.props.selectedEventID < 0) {
                  this.props.selectEvent(
                    rowInfo.viewIndex,
                    rowInfo.row.ID,
                    false
                  );
                }
              }

              return {
                onClick: (e, handleOriginal) => {
                  this.props.selectEvent(
                    rowInfo.viewIndex,
                    rowInfo.row.ID,
                    true
                  );

                  if (handleOriginal) {
                    handleOriginal();
                  }
                },
                className: classname
              };
            } else {
              return {};
            }
          }}
          defaultSorted={[
            {
              id: "id",
              desc: true
            }
          ]}
          defaultPageSize={10}
        />
      </div>
    );
  };
}
