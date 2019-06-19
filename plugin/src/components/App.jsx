import React, { Component } from "react";
import TracerTable from "../containers/TracerTable";
import DetailsViewer from "../containers/DetailsViewer";
import TracerEventsTable from "../containers/TracerEventsTable";
import FilterColumn from "../components/FilterColumn";
import RequestTable from "../containers/RequestTable";
import NavSidebar from "../containers/NavSidebar";
import "../styles/App.css";

export default class App extends Component {
  render = () => (
    <div className="app">
      <NavSidebar />
      <div className="tables">
        <FilterColumn />
        <TracerTable />
        <RequestTable />
        <TracerEventsTable />
      </div>
      <DetailsViewer />
    </div>
  );
}
