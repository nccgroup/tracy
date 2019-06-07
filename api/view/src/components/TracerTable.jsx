import React, { Component } from "react";
import ReactTable from "react-table";
import * as utils from "../utils";

export default class TracerTable extends Component {
  render() {
    if (this.props.loading) {
      utils.getTracers().then(req => this.props.updateTracers(req));
    }

    let data = this.props.tracers;
    if (this.props.filterInactive) {
      data = data.filter(utils.filterInactive);
    }

    return (
      <div className="table-container table-container-tracers">
        <span className="filler" />

        <ReactTable
          className="grow-table"
          data={data}
          loading={this.props.loading}
          showPageSizeOptions={false}
          showPageJump={false}
          columns={[
            {
              Header: "injection points",
              columns: [
                { Header: "id", accessor: "ID", width: 45 },
                {
                  Header: "tracer string",
                  accessor: "TracerString",
                  width: 105
                },
                { Header: "payload", accessor: "TracerPayload", width: 105 },
                { Header: "sev", accessor: "OverallSeverity", width: 45 }
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
      </div>
    );
  }
}
