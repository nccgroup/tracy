import React from "react";
import { connect } from "react-redux";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import * as actions from "../actions/index";

const mapDispatchToProps = dispatch => ({
  refresh: () => dispatch(actions.refresh())
});

const RefreshButton = props => {
  return (
    <ul className="refresh-button">
      <li
        onClick={props.refresh}
        className="clickable "
        title="refresh tracers and events"
      >
        <FontAwesomeIcon icon="sync" />
      </li>
    </ul>
  );
};

export default connect(null, mapDispatchToProps)(RefreshButton);
