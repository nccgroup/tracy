import React, { Component } from "react";
import ReactTable from "react-table";

export default class RequestTable extends Component {
  render = () => {
    return (
      <div className="table-container table-container-requests">
        <span className="filler" />

        <ReactTable
          className="grow-table"
          data={this.props.requests}
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
              if (rowInfo.row.ID === this.props.selectedRequestID) {
                classname += " row-selected";
              }

              return {
                onClick: (e, handleOriginal) => {
                  this.props.selectRequest(rowInfo.row.ID);

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
