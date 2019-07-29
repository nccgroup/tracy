import React, { Component } from "react";
import ReactTable from "react-table";
import * as utils from "../utils/index";
export default class RequestTable extends Component {
  componentDidMount = () => {
    utils.createKeyDownHandler(
      "request",
      () => this.props.lastSelectedTable,
      () =>
        this.props.selectRequest(
          utils.mod(
            this.props.selectedRequestTableIndex - 1,
            this.props.requests.length
          ),
          -1,
          false
        ),
      () =>
        this.props.selectRequest(
          utils.mod(
            this.props.selectedRequestTableIndex + 1,
            this.props.requests.length
          ),
          -1,
          false
        )
    );
  };
  render = () => {
    return (
      <div className="table-container table-container-requests">
        <span className="filler" />

        <ReactTable
          className="grow-table"
          data={this.props.requests.map(utils.enumerate)}
          loading={this.props.loading}
          showPageSizeOptions={false}
          showPageJump={false}
          loadingText="click a tracer for more details"
          columns={[
            {
              Header: "http injection requests",
              columns: [
                { Header: "id", accessor: "ID", width: 45 },
                { Header: "method", accessor: "RequestMethod", width: 45 },
                { Header: "url", accessor: "RequestURL" }
              ]
            }
          ]}
          getTrProps={(state, rowInfo, column, instance) => {
            if (rowInfo) {
              let classname = "";
              if (rowInfo.viewIndex === this.props.selectedRequestTableIndex) {
                classname += " row-selected";
                if (this.props.selectedRequestID < 0) {
                  this.props.selectRequest(
                    rowInfo.viewIndex,
                    rowInfo.row.ID,
                    false
                  );
                }
              }

              return {
                onClick: (e, handleOriginal) => {
                  this.props.selectRequest(
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
          defaultPageSize={25}
        />
      </div>
    );
  };
}
