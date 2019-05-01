import { connect } from "react-redux";
import MetaView from "../components/MetaView";
import { selectedTracerByID } from "../utils";
const mapStateToProps = state => ({
  tracer: selectedTracerByID(state.tracers, state.selectedTracerID) || {}
});

export default connect(mapStateToProps)(MetaView);
