import { connect } from "react-redux";
import DetailsViewer from "../components/DetailsViewer";

const mapStateToProps = state => ({
  tabID: state.tabID
});

export default connect(mapStateToProps)(DetailsViewer);
