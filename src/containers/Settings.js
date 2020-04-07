import Settings from "../components/Settings";
import * as actions from "../actions/";
import { connect } from "react-redux";

const mapStateToProps = state => ({
  tracyEnabled: state.tracyEnabled,
  apiKey: state.apiKey,
  projName: state.projName,
  projs: state.projs,
  tracerPayloads: state.tracerPayloads
});

const mapDispatchToProps = dispatch => ({
  updateProjects: proj => dispatch(actions.updateProjects(proj)),
  changeSetting: setting => dispatch(actions.changeSetting(setting))
});
export default connect(mapStateToProps, mapDispatchToProps)(Settings);
