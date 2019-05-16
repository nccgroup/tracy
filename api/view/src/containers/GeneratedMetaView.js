import { connect } from "react-redux";
import GeneratedMetaView from "../components/GeneratedMetaView";
import * as utils from "../utils/index";
const mapStateToProps = state => ({
  tracer: utils.firstElemByID(state.tracers, state.selectedTracerID) || {}
});

export default connect(mapStateToProps)(GeneratedMetaView);
