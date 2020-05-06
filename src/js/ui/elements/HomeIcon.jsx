import React from "react";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import { connect } from "react-redux";
import { navigateToUIPage } from "../actions/index";

const mapDispatchToProps = (dispatch) => ({
  navigateToUIPage: () => dispatch(navigateToUIPage()),
});

const HomeIcon = (props) => {
  return (
    <div
      title="home"
      className="home-icon clickable"
      onClick={() => props.navigateToUIPage()}
    >
      <FontAwesomeIcon icon="home" />
    </div>
  );
};
export default connect(null, mapDispatchToProps)(HomeIcon);
