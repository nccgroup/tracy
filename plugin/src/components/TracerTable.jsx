/* global chrome */
import React, { Component } from "react";
import ReactTable from "react-table";
import * as utils from "../utils";

export default class TracerTable extends Component {
  componentDidMount() {
    const port = chrome.runtime.connect({ name: "TracerTable" });
    port.onMessage.addListener(msg => {
      switch (Object.keys(msg).pop()) {
        case "addTracer":
          this.props.addOrUpdateTracer(Object.values(msg).pop(), false);
          break;
        case "addRequestToTracer":
          if (this.props.selectedTracerPayload === "") {
            return;
          }
          const req = Object.values(msg).pop();
          const tp = req.tracerPayload;
          let tracer = {
            ...this.props.tracers.filter(t => t.TracerPayload === tp).pop()
          };
          if (tracer.Requests) {
            tracer.Requests = [...tracer.Requests, req.request];
          } else {
            tracer.Requests = [req.request];
          }

          this.props.addOrUpdateTracer(tracer, false);
          break;
        case "updateTracerOverallSeverity":
          console.log("updaing overallseverity", msg);
          this.props.addOrUpdateTracer(Object.values(msg).pop().tracer);
        default:
          break;
      }
    });
    port.onDisconnect.addListener(() => console.log("disconnected"));
    this.refresh();
  }

  refresh = async () => {
    const tracers = await utils.getTracers();
    console.log("tracers", tracers);
    this.props.updateTracers(tracers);
  };

  render() {
    if (this.props.loading) {
      this.refresh();
    }

    let data = this.props.tracers;
    if (this.props.filterInactive) {
      data = data.filter(utils.filterInactive);
    }

    return (
      <div className="table-contPainer table-container-tracers">
        <span className="filler" />

        <ReactTable
          className="grow-table"
          data={data.map(utils.enumerate)}
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

              if (
                rowInfo.row.TracerPayload === this.props.selectedTracerPayload
              ) {
                classname += " row-selected";
              }

              return {
                onClick: (e, handleOriginal) => {
                  this.props.selectTracer(rowInfo.row.TracerPayload);

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
