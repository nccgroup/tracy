import React, { Component } from "react";
import TracyLogo from "./TracyLogo";
import SettingsIcon from "./SettingsIcon";
import HomeIcon from "./HomeIcon";
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
