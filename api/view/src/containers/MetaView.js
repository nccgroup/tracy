import { connect } from "react-redux";
import MetaView from "../components/MetaView";
import { firstElemByID } from "../utils";
const mapStateToProps = state => ({
  tracer: firstElemByID(state.tracers, state.selectedTracerID) || {}
});

export default connect(mapStateToProps)(MetaView);
