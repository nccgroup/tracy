import React, { Component } from "react";
import ArrowNavigationTable from "./ArrowNavigationTable";
import { enumerate, filterReferers } from "../../shared/ui-helpers";
export default class RequestTable extends Component {
  render = () => {
    let requests = this.props.requests.map(enumerate);
    if (this.props.refererFilter) {
      requests = requests.filter(
        filterReferers(this.props.selectedTracerPayload)
      );
    }
    return (
      <div className="table-container table-container-requests">
        <span className="filler" />

        <ArrowNavigationTable
          {...this.props}
          tableType="request"
          data={requests}
          columns={[
            {
              Header: "http injection requests",
              columns: [
                { Header: "id", accessor: "ID", width: 45 },
                { Header: "method", accessor: "RequestMethod", width: 45 },
                { Header: "url", accessor: "RequestURL" },
              ],
            },
          ]}
          defaultPageSize={10}
          defaultSorted={[
            {
              id: "id",
              desc: true,
            },
          ]}
        />
      </div>
    );
  };
}
