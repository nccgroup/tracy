import React, { Component } from "react";
import { connect } from "react-redux";
import Inputs from "./Inputs";
import Outputs from "./Outputs";
const mapStateToProps = (state) => ({
  tabID: state.tabID,
});

class DetailsViewer extends Component {
  render = () => (
    <div
      style={this.props.hidden ? { display: "none" } : {}}
      className="details"
    >
      <Inputs />
      <Outputs />
    </div>
  );
}

export default connect(mapStateToProps)(DetailsViewer);
