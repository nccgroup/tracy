import { connect } from "react-redux";
import TracyTable from "../components/TracerTable";
import * as actions from "../actions";

const mapStateToProps = state => ({
  tracers: state.tracers,
  selectedTracerPayload: state.selectedTracerPayload,
  selectedTracerTableIndex: state.selectedTracerTableIndex,
  filterInactive: state.inactiveTracersFilter,
  loading: state.tracersLoading,
  lastSelectedTable: state.lastSelectedTable
});

const mapDispatchToProps = dispatch => ({
  addOrUpdateTracer: (tracer, skipReload) =>
    dispatch(actions.addTracer(tracer, skipReload)),
  updateTracers: (tracers, payload) =>
    dispatch(actions.updateTracers(tracers, payload)),
  selectRow: (index, _, clicked, row) =>
    dispatch(
      actions.selectTracer(
        index,
        row === null ? "" : row.TracerPayload,
        clicked
      )
    ),
  tracersLoading: () => dispatch(actions.tracersLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(TracyTable);
