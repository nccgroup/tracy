import { connect } from "react-redux";
import NavSidebar from "../components/NavSidebar";
const mapStateToProps = state => ({ tracyLocal: state.tracyLocal });
export default connect(mapStateToProps)(NavSidebar);
