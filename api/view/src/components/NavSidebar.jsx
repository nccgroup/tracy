import React, { Component } from "react";
import TracyLogo from "../components/TracyLogo";
import WebSocketRouter from "../containers/WebSocketRouter";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
export default class NavSidebar extends Component {
  render = () => (
    <div className="nav-sidebar">
      <div className="upper-nav">
        <TracyLogo />
      </div>
      <div className="lower-nav">
        <div
          title="settings"
          className="settings clickable"
          onClick={() => window.open(this.props.settingsPage)}
        >
          <FontAwesomeIcon icon="cog" />
        </div>
        <WebSocketRouter />
      </div>
    </div>
  );
}
