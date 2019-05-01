import { connect } from "react-redux";
import RawView from "../components/RawView";
import { selectedTracerByID, selectedEventByID } from "../utils/index";
const mapStateToProps = state => ({
  tracer: selectedTracerByID(state.tracers, state.selectedTracerID) || {},
  event: selectedEventByID(state.events, state.selectedEventID) || {}
});

export default connect(mapStateToProps)(RawView);
