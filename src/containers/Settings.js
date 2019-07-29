import { connect } from "react-redux";
import Settings from "../components/Settings";
import * as actions from "../actions";

const mapDispatchToProps = dispatch => ({
  navigateToSettingsPage: () => dispatch(actions.navigateToSettingsPage())
});

export default connect(null, mapDispatchToProps)(Settings);
