/* global chrome */
import React, { Component } from "react";
import ArrowNavigationTable from "./ArrowNavigationTable";
import { rpc } from "../../shared/rpc";
import { channel } from "../../shared/channel-cs";
import { enumerate, filterInactive } from "../../shared/ui-helpers";

const r = rpc(channel);
export default class TracerTable extends Component {
  componentDidMount() {
    const port = chrome.runtime.connect({ name: "TracerTable" });
    port.onMessage.addListener((msg) => {
      switch (Object.keys(msg).pop()) {
        case "addTracer":
          this.props.addOrUpdateTracer(Object.values(msg).pop(), false);
          break;
        case "addRequestsToTracer":
          if (this.props.selectedTracerPayload === "") {
            return;
          }
          const reqs = Object.values(msg).pop();
          const tp = reqs.tracerPayload;
          let tracer = {
            ...this.props.tracers.filter((t) => t.TracerPayload === tp).pop(),
          };
          if (tracer.Requests) {
            tracer.Requests = [...tracer.Requests, ...reqs.requests];
          } else {
            tracer.Requests = reqs.requests;
          }

          this.props.addOrUpdateTracer(tracer, false);
          break;
        case "updateTracer":
          this.props.addOrUpdateTracer(Object.values(msg).pop().tracer);
          break;
        default:
          break;
      }
    });
    port.onDisconnect.addListener((e) => {
      console.log("disconnected", chrome.runtime.lastError, e);
    });
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
      <div className="table-container table-container-tracers">
        <span className="filler" />
        <ArrowNavigationTable
          {...this.props}
          tableType="tracer"
          data={data.map(enumerate)}
          columns={[
            {
              Header: "injection pointszzzzzzzzzz",
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
