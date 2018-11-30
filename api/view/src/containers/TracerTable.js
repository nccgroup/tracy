import { connect } from "react-redux";
import TracyTable from "../components/TracerTable";
import { selectTracer, updateTracers } from "../actions";
import { formatTracer } from "../utils";

const mapStateToProps = state => ({
  tracers: state.tracers.map(formatTracer),
  selectedTracerID: state.selectedTracerID,
  loading: state.tracersLoading
});

const mapDispatchToProps = dispatch => ({
  updateTracers: tracers => dispatch(updateTracers(tracers)),
  selectTracer: id => dispatch(selectTracer(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(TracyTable);
