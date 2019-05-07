import { connect } from "react-redux";
import DetailsViewer from "../components/DetailsViewer";
import { changeTab } from "../actions/index.js";
const mapStateToProps = state => ({
  tabID: state.tabID
});

const mapDispatchToProps = dispatch => ({
  changeTab: i => dispatch(changeTab(i))
});

export default connect(mapStateToProps, mapDispatchToProps)(DetailsViewer);
