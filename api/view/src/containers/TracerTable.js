import { connect } from "react-redux";
import TracyTable from "../components/TracerTable";
import { selectTracer, updateTracers } from "../actions";

const mapStateToProps = state => ({
  tracers: state.tracers,
  selectedTracerID: state.selectedTracerID,
  loading: state.tracersLoading
});

const mapDispatchToProps = dispatch => ({
  updateTracers: tracers => dispatch(updateTracers(tracers)),
  selectTracer: id => dispatch(selectTracer(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(TracyTable);
