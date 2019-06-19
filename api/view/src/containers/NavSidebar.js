import { connect } from "react-redux";
import NavSidebar from "../components/NavSidebar";
const mapStateToProps = state => ({ settingsPage: state.settingsPage });
export default connect(mapStateToProps)(NavSidebar);
