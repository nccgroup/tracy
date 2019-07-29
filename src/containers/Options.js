import Options from "../components/Options";
import * as actions from "../actions/";
import { connect } from "react-redux";

const mapStateToProps = state => ({
  tracyHost: state.tracyHost,
  tracyPort: state.tracyPort,
  tracyEnabled: state.tracyEnabled,
  tracyLocal: state.tracyLocal,
  apiKey: state.apiKey,
  projName: state.projName,
  projs: state.projs
});

const mapDispatchToProps = dispatch => ({
  updateProjects: proj => dispatch(actions.updateProjects(proj)),
  changeSetting: setting => dispatch(actions.changeSetting(setting)),
  navigateToUIPage: () => dispatch(actions.navigateToUIPage())
});
export default connect(mapStateToProps, mapDispatchToProps)(Options);
