import React, { Component } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { getTracerEvents, formatEvent, enumerate } from "../utils";

export default class TracerEventsTable extends Component {
  render() {
    if (this.props.loading) {
      getTracerEvents(this.props.selectedTracerID).then(events =>
        this.props.updateEvents(
          events
            .map(formatEvent)
            .flat()
            .map(enumerate)
        )
      );
    }
    return (
      <ReactTable
        data={this.props.events}
        loading={this.props.loading}
        manual
        columns={[
          {
            Header: "observed outputs",
            columns: [
              { Header: "id", accessor: "ID", width: 45 },
              //   { Header: "host", accessor: "EventHost" },
              { Header: "url", accessor: "EventPath" },
              /*                  {
                    Header: "location",
                    accessor: "HTMLLocationType"
                  },*/
              /*{
                    Header: "node",
                    accessor: "HTMLNodeType"
                  },*/
              {
                Header: "type",
                accessor: "EventType"
              },
              {
                Header: "sev",
                accessor: "Severity",
                width: 45
              } //,
              //                  { Header: "reproduce", width: 5 }
            ]
          }
        ]}
        getTdProps={(state, rowInfo, column) => {
          return {
            onClick: (e, handleOriginal) => {
              if (column.Header === "reproduce") {
                this.reproduce();
              }
              if (handleOriginal) {
                handleOriginal();
              }
            }
          };
        }}
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

            if (rowInfo.row.ID === this.props.selectedEventID) {
              classname += " row-selected";
            }

            return {
              onClick: (e, handleOriginal) => {
                this.props.selectEvent(rowInfo.row.ID);

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
        defaultPageSize={25}
      />
    );
  }
}
