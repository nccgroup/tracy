import React, { Component } from "react";
import RawView from "./RawView";

export default class Outputs extends Component {
  render = () => (
    <div className="outputs">
      <div className="frame">
        <RawView />
      </div>
    </div>
  );
}
