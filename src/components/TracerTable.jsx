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
        case "addRequestsToTracer":
          if (this.props.selectedTracerPayload === "") {
            return;
          }
          const reqs = Object.values(msg).pop();
          const tp = reqs.tracerPayload;
          let tracer = {
            ...this.props.tracers.filter(t => t.TracerPayload === tp).pop()
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
    port.onDisconnect.addListener(e => {
      console.log("disconnected", chrome.runtime.lastError, e);
    });
    this.refresh();

    utils.createKeyDownHandler(
      "tracer",
      () => this.props.lastSelectedTable,
      () =>
        this.props.selectTracer(
          utils.mod(
            this.props.selectedTracerTableIndex - 1,
            this.props.tracers.length
          ),
          "",
          false
        ),
      () =>
        this.props.selectTracer(
          utils.mod(
            this.props.selectedTracerTableIndex + 1,
            this.props.tracers.length
          ),
          "",
          false
        )
    );
  }

  refresh = async () => {
    this.props.updateTracers(await utils.getTracers());
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
      <div className="table-container table-container-tracers">
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
              if (rowInfo.viewIndex === this.props.selectedTracerTableIndex) {
                // Check to make sure the table entries haven't changed. If they have correct it.
                if (
                  rowInfo.row.TracerPayload !== this.props.selectedTracerPayload
                ) {
                  if (this.props.selectedTracerPayload === "") {
                    this.props.selectTracer(
                      rowInfo.viewIndex,
                      rowInfo.row.TracerPayload,
                      false
                    );
                  } else {
                    state.pageRows
                      .filter(
                        d =>
                          d.TracerPayload === this.props.selectedTracerPayload
                      )
                      .map(d => d._viewIndex)
                      .map(i =>
                        this.props.selectTracer(
                          i,
                          this.props.selectedTracerPayload,
                          false
                        )
                      );
                  }
                }
                classname += " row-selected";
              }

              return {
                onClick: (e, handleOriginal) => {
                  this.props.selectTracer(
                    rowInfo.viewIndex,
                    rowInfo.row.TracerPayload,
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
          defaultPageSize={10}
        />
      </div>
    );
  }
}
