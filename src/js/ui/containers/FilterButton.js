import { connect } from "react-redux";
import FilterButton from "../components/FilterButton";
import { toggleFilter } from "../actions";

const mapDispatchToProps = dispatch => {
  return {
    toggleFilter: filter => dispatch(toggleFilter(filter))
  };
};

export default connect(null, mapDispatchToProps)(FilterButton);
