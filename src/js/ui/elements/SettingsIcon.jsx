import React, { Component } from "react";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import { connect } from "react-redux";
import * as actions from "../actions";

const mapDispatchToProps = (dispatch) => ({
  navigateToSettingsPage: () => dispatch(actions.navigateToSettingsPage()),
});

class SettingsIcon extends Component {
  render = () => (
    <div
      title="settings"
      className="settings clickable"
      onClick={() => this.props.navigateToSettingsPage()}
    >
      <FontAwesomeIcon icon="cog" />
    </div>
  );
}
export default connect(null, mapDispatchToProps)(SettingsIcon);
