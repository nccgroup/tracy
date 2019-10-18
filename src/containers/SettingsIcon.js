import { connect } from "react-redux";
import SettingsIcon from "../components/SettingsIcon";
import * as actions from "../actions";

const mapDispatchToProps = dispatch => ({
  navigateToSettingsPage: () => dispatch(actions.navigateToSettingsPage())
});

export default connect(null, mapDispatchToProps)(SettingsIcon);
