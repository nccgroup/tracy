import React, { Component } from "react";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";

class Settings extends Component {
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

export default Settings;
