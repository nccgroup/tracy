import React, { Component } from "react";
import InstallLinks from "./InstallLinks";
import Settings from "./Settings";

class Footer extends Component {
  render() {
    return (
      <div>
        <span>raw request</span>
        <span>raw output</span>
        <Settings />
        <InstallLinks />
      </div>
    );
  }
}

export default Footer;
