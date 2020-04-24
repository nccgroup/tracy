/* global chrome */
import React, { Component } from "react";
import ArrowNavigationTable from "./ArrowNavigationTable";
import { rpc } from "../../shared/rpc";
import { channel } from "../../shared/channel-cs";
import { enumerate, filterInactive } from "../../shared/ui-helpers";

const r = rpc(channel);
export default class TracerTable extends Component {
  componentDidMount() {
    this.refresh();
    setInterval(this.refresh, 5000);
    this.props.tracersLoading();
  }

  refresh = async () => {
    this.props.updateTracers(
      await r.getTracers(),
      this.props.selectedTracerPayload
    );
  };

  render() {
    if (this.props.loading) {
      this.refresh();
    }

    let data = this.props.tracers;
    if (this.props.filterInactive) {
      data = data.filter(filterInactive);
    }

    return (
      <div id="tracer" className="table-container table-container-tracers">
        <span className="filler" />
        <ArrowNavigationTable
          {...this.props}
          tableType="tracer"
          data={data.map(enumerate)}
          columns={[
            {
              Header: "injection points",
              columns: [
                { Header: "id", accessor: "ID", width: 45 },
                {
                  Header: "tracer string",
                  accessor: "TracerString",
                  width: 105,
                },
                { Header: "payload", accessor: "TracerPayload", width: 105 },
                { Header: "sev", accessor: "Severity", width: 45 },
              ],
            },
          ]}
          defaultSorted={[
            {
              id: "id",
              desc: true,
            },
          ]}
          defaultPageSize={10}
        />
      </div>
    );
  }
}
