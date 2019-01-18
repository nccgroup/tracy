import React, { Component } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { getTracers, formatRequest } from "../utils";
import Col from "react-bootstrap/lib/Col";
import FormGroup from "react-bootstrap/lib/FormGroup";

export default class TracerTable extends Component {
  render() {
    if (this.props.loading) {
      getTracers().then(req => {
        this.props.updateTracers(req.map(formatRequest).flat());
      });
    }

    return (
      <ReactTable
        data={this.props.tracers}
        loading={this.props.loading}
        columns={[
          {
            Header: "injection points",
            columns: [
              { Header: "id", accessor: "ID", width: 45 },
              //              { Header: "method", accessor: "RequestMethod" },
              { Header: "url", accessor: "RequestURL" },
              //              { Header: "path", accessor: "RequestPath" },
              //              { Header: "tracer string", accessor: "TracerString" },
              {
                Header: "payload",
                accessor: "TracerPayload",
                width: 105
              },
              {
                Header: "sev",
                accessor: "OverallSeverity",
                width: 45
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
                this.props.selectTracer(rowInfo.row.ID);

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
