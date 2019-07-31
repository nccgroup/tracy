import React, { Component } from "react";
import TracyLogo from "../components/TracyLogo";
import WebSocketRouter from "../containers/WebSocketRouter";
import Settings from "../containers/Settings";
export default class NavSidebar extends Component {
  render = () => (
    <div className="nav-sidebar">
      <div className="upper-nav">
        <TracyLogo />
      </div>
      <div className="lower-nav">
        <Settings />
        {!this.props.tracyLocal ? <WebSocketRouter /> : ""}
      </div>
    </div>
  );
}
