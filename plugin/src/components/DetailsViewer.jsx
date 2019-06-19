import React, { Component } from "react";
import Inputs from "../containers/Inputs";
import Outputs from "../containers/Outputs";
export default class DetailsViewer extends Component {
  render = () => {
    return (
      <div className="details">
        <Inputs />
        <Outputs />
      </div>
    );
  };
}
