import React, { Component } from "react";
import MetaView from "../containers/MetaView";
import RawView from "../containers/RawView";
export default class DetailsViewer extends Component {
  changeTab = e => {
    this.props.changeTab(e.target.getAttribute("data"));
  };

  render = () => {
    let o;
    switch (this.props.tabID) {
      case "0":
        o = <MetaView />;
        break;
      case "1":
        o = <RawView />;
        break;
      case "2":
        o = <span>repros</span>;
        break;
      default:
        o = <MetaView />;
    }
    return (
      <div className="details">
        <ul>
          <li>
            <button data="0" onClick={this.changeTab}>
              meta
            </button>
          </li>
          <li>
            <button data="1" onClick={this.changeTab}>
              raw
            </button>
          </li>
          <li>
            <button data="2" onClick={this.changeTab}>
              reproductions
            </button>
          </li>
        </ul>

        {o}
      </div>
    );
  };
}
