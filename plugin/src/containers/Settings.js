import { connect } from "react-redux";
import Settings from "../components/Settings";
import * as actions from "../actions";

const mapStateToProps = state => ({
  settingsPage: state.settingsPage
});

const mapDispatchToProps = dispatch => ({
  changeSetting: setting => dispatch(actions.changeSetting(setting))
});

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
