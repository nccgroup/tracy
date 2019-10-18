import React, { Component } from "react";
import TracerTable from "../containers/TracerTable";
import DetailsViewer from "../containers/DetailsViewer";
import TracerEventsTable from "../containers/TracerEventsTable";
import FilterColumn from "../components/FilterColumn";
import RequestTable from "../containers/RequestTable";
import NavSidebar from "../containers/NavSidebar";
import Settings from "../containers/Settings";
import "../styles/App.css";

export default class App extends Component {
  render = () => {
    if (this.props.appInitialized) {
      return (
        <div className="app">
          <NavSidebar />
          <Settings hidden={!this.props.onSettingsPage} />
          <div
            style={this.props.onSettingsPage ? { display: "none" } : {}}
            className="tables"
          >
            <FilterColumn />
            <TracerTable />
            <RequestTable />
            <TracerEventsTable />
          </div>
          <DetailsViewer hidden={this.props.onSettingsPage} />
        </div>
      );
    }

    return (
      <div className="app">
        <span>loading</span>
      </div>
    );
  };
}
