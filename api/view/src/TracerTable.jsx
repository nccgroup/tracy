import React, { Component } from "react";
import "./App.css";
import ReactTable from "react-table";
import "react-table/react-table.css";

class TracerTable extends Component {
  constructor(props) {
    super(props);

    this.onRowSelect = this.onRowSelect.bind(this);
  }

  onRowSelect(row) {
    this.props.handleTracerSelection(row);
  }

  shouldComponentUpdate(nextProps, nextState) {
    let ret = false;
    if (
      (!this.props.tracer && nextProps.tracers) ||
      nextProps.tracers.length !== this.props.tracers.length ||
      nextProps.selectedTracerID !== this.props.selectedTracerID
    ) {
      ret = true;
    }
    return ret;
  }

  render() {
    let onRowSelect = this.onRowSelect;
    return (
      <ReactTable
        data={this.props.tracers}
        columns={[
          {
            Header: "injection points",
            columns: [
              { Header: "id", accessor: "ID", width: 45 },
              { Header: "method", accessor: "RequestMethod" },
              { Header: "host", accessor: "RequestURL", width: 225 },
              { Header: "path", accessor: "RequestPath" },
              { Header: "tracer string", accessor: "TracerString" },
              {
                Header: "payload",
                accessor: "TracerPayload",
                width: 105
              },
              {
                Header: "severity",
                accessor: "OverallSeverity",
                width: 75
              }
            ]
          }
        ]}
        getTrProps={(state, rowInfo, column, instance) => {
          if (rowInfo) {
            let classname = "";
            switch (rowInfo.row.OverallSeverity) {
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

            if (rowInfo.row.ID === this.props.selectedTracerID) {
              classname += " row-selected";
            }

            return {
              onClick: (e, handleOriginal) => {
                onRowSelect(rowInfo.row);

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

export default TracerTable;
