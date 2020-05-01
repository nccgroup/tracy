import React, { Component } from "react";
import ArrowNavigationTable from "./ArrowNavigationTable";
import { rpc } from "../../shared/rpc";
import { channel } from "../../shared/channel-cs";
import { filterInactive } from "../../shared/ui-helpers";
import { connect } from "react-redux";
import {
  addTracer,
  updateTracers,
  selectTracer,
  tracersLoading,
} from "../actions";
const r = rpc(channel);

const mapStateToProps = (state) => ({
  tracers: state.tracers,
  selectedTracerPayload: state.selectedTracerPayload,
  selectedTracerTableIndex: state.selectedTracerTableIndex,
  filterInactive: state.inactiveTracersFilter,
  refresh: state.tracersRefresh,
  loading: state.tracersLoading,
  lastSelectedTable: state.lastSelectedTable,
});

const mapDispatchToProps = (dispatch) => ({
  addOrUpdateTracer: (tracer, skipReload) =>
    dispatch(addTracer(tracer, skipReload)),
  updateTracers: (tracers, payload) =>
    dispatch(updateTracers(tracers, payload)),
  selectRow: (index, id, clicked, row) =>
    dispatch(selectTracer(index, id, !row ? "" : row.TracerPayload, clicked)),
  tracersLoading: () => dispatch(tracersLoading()),
});
const defaultSort = [
  {
    id: "ID",
    desc: true,
  },
];
const columns = [
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
];

class TracerTable extends Component {
  componentDidMount() {
    this.refresh();
    //setInterval(this.refresh, 5000);
    this.props.tracersLoading();
  }

  refresh = async () => {
    const tracers = await r.getTracers();
    if (tracers.length > 0 && !this.props.selectedTracerPayload) {
      this.props.updateTracers(
        tracers,
        tracers[tracers.length - 1].TracerPayload
      );
    }
    this.props.updateTracers(tracers, this.props.selectedTracerPayload);
  };

  render() {
    if (this.props.refresh) {
      this.refresh();
    }
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
          data={data}
          columns={columns}
          defaultSorted={defaultSort}
          defaultPageSize={10}
        />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(TracerTable);
