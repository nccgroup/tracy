import React, { Component } from "react";
import ArrowNavigationTable from "./ArrowNavigationTable";
import { rpc } from "../../shared/rpc";
import { channel } from "../../shared/channel-cs";
import { filterInactive } from "../../shared/ui-helpers";
import { connect } from "react-redux";
import { updateTracers, selectTracer, tracersLoading } from "../actions";
const r = rpc(channel);

const mapStateToProps = (state) => ({
  tracers: state.tracers,
  selectedID: state.selectedTracerID,
  filterInactive: state.inactiveTracersFilter,
  refresh: state.tracersRefresh,
  loading: state.tracersLoading,
  lastSelectedTable: state.lastSelectedTable,
});

const mapDispatchToProps = (dispatch) => ({
  updateTracers: (tracers) => dispatch(updateTracers(tracers)),
  selectRow: (id, clicked) => dispatch(selectTracer(id, clicked)),
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
    this.props.tracersLoading();
  }

  pollForTracers = async () => {
    const tracers = await r.getTracers();
    this.props.tracers.map((t) => URL.revokeObjectURL(t.Screenshot));
    this.props.updateTracers(tracers);
  };

  render() {
    // app triggers the table to get the latest set of tracers
    if (this.props.refresh) {
      this.pollForTracers();
    }
    if (this.props.loading) {
      this.pollForTracers();
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
