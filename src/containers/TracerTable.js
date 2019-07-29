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
  updateTracers: tracers => dispatch(actions.updateTracers(tracers)),
  selectTracer: (index, payload) =>
    dispatch(actions.selectTracer(index, payload))
});

export default connect(mapStateToProps, mapDispatchToProps)(TracyTable);
