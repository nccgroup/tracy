import { connect } from "react-redux";
import HomeIcon from "../components/HomeIcon";
import * as actions from "../actions/index";

const mapDispatchToProps = dispatch => ({
  navigateToUIPage: () => dispatch(actions.navigateToUIPage())
});
export default connect(null, mapDispatchToProps)(HomeIcon);
