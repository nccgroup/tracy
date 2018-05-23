import React, { Component } from "react";
import FirefoxLogo from "./FirefoxLogo";
import ChromeLogo from "./ChromeLogo";

class InstallLinks extends Component {
	/* This is a static component that should never update. */
	shouldComponentUpdate(nextProps, nextState) {
		return false;
	}
	render() {
		let ret = <FirefoxLogo />;
		if (window.chrome) {
			ret = <ChromeLogo />;
		}

		return ret;
	}
}

export default InstallLinks;
