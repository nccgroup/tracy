import React, { Component } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { getTracers } from "../utils";
import Col from "react-bootstrap/lib/Col";
import FormGroup from "react-bootstrap/lib/FormGroup";

export default class TracerTable extends Component {
  render() {
    console.log("tracer table:", this.props);
    if (this.props.loading) {
      getTracers().then(tracers => this.props.updateTracers(tracers));
      return (
        <FormGroup className="loading-spinner-parent">
          <Col md={12} className="loading-spinner-child text-center">
            <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate" />
          </Col>
        </FormGroup>
      );
    }
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
