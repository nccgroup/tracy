import { connect } from "react-redux";
import DetailsViewer from "../components/DetailsViewer";
import { selectedTracerByID, selectedEventByID } from "../utils";

const mapStateToProps = state => ({
  tracer: selectedTracerByID(state.tracers, state.selectedTracerID) || {},
  event: selectedEventByID(state.events, state.selectedEventID) || {}
});

export default connect(mapStateToProps)(DetailsViewer);
