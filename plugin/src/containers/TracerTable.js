import { connect } from "react-redux";
import TracyTable from "../components/TracerTable";
import * as actions from "../actions";

const mapStateToProps = state => ({
  tracers: state.tracers,
  selectedTracerPayload: state.selectedTracerPayload,
  filterInactive: state.inactiveTracersFilter,
  loading: state.tracersLoading
});

const mapDispatchToProps = dispatch => ({
  addOrUpdateTracer: (tracer, skipReload) =>
    dispatch(actions.addTracer(tracer, skipReload)),
  updateTracers: tracers => dispatch(actions.updateTracers(tracers)),
  selectTracer: payload => dispatch(actions.selectTracer(payload))
});

export default connect(mapStateToProps, mapDispatchToProps)(TracyTable);
