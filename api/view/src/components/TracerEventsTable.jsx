import React, { Component } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import * as utils from "../utils";

export default class TracerEventsTable extends Component {
  render = () => {
    if (this.props.loading) {
      utils.getTracerEvents(this.props.selectedTracerID).then(events =>
        this.props.updateEvents(
          events
            .map(utils.formatEvent)
            .flat()
            .map(utils.enumerate)
        )
      );
    }
    let data = this.props.events;
    if (this.props.filterTextNodes) {
      data = data.filter(utils.filterTextNodes);
    }

    return (
      <ReactTable
        className="tracer-events-table"
        data={data}
        loading={this.props.loading}
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
  };
}
