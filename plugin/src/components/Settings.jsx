/* global chrome */
import React, { Component } from "react";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";

class Settings extends Component {
  constructor(props) {
    super(props);
    chrome.storage.onChanged.addListener((changes, areaName) => {
      Object.keys(changes).map(k => {
        this.props.changeSetting(changes[k]);
      });
    });
  }

  render = () => (
    <div
      title="settings"
      className="settings clickable"
      onClick={() => window.open(this.props.settingsPage)}
    >
      <FontAwesomeIcon icon="cog" />
    </div>
  );
}

export default Settings;
