import { connect } from "react-redux";
import RawView from "../components/RawView";
import { firstElemByID } from "../utils/index";
const mapStateToProps = state => ({
  tracer: firstElemByID(state.tracers, state.selectedTracerID) || {},
  event: firstElemByID(state.events, state.selectedEventID) || {}
});

export default connect(mapStateToProps)(RawView);
