import React, { Component } from "react";
import TracerTable from "../containers/TracerTable";
import DetailsViewer from "../containers/DetailsViewer";
import TracerEventsTable from "../containers/TracerEventsTable";
import FilterColumn from "../components/FilterColumn";
import TracyLogo from "../components/TracyLogo";
import WebSocketRouter from "../containers/WebSocketRouter";
import "../styles/App.css";

export default class App extends Component {
  render() {
    return (
      <div className="app">
        <div className="nav-sidebar">
          <TracyLogo />
          <WebSocketRouter />
        </div>
        <div className="tables">
          <FilterColumn />
          <TracerTable />
          <TracerEventsTable />
        </div>
        <DetailsViewer />
      </div>
    );
  }
}
