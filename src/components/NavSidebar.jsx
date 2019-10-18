import React, { Component } from "react";
import TracyLogo from "../components/TracyLogo";
import SettingsIcon from "../containers/SettingsIcon";
import HomeIcon from "../containers/HomeIcon";
export default class NavSidebar extends Component {
  render = () => (
    <div className="nav-sidebar">
      <div className="upper-nav">
        <TracyLogo />
      </div>
      <div className="lower-nav">
        <HomeIcon />
        <SettingsIcon />
      </div>
    </div>
  );
}
