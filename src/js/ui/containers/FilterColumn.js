import { connect } from "react-redux";
import FilterColumn from "../components/FilterColumn";

const mapStateToProps = state => ({
  textFilter: state.textFilter,
  inactiveTracersFilter: state.inactiveTracersFilter,
  refererFilter: state.refererFilter
});

export default connect(mapStateToProps)(FilterColumn);
