import React, { Component } from "react";
import { connect } from "react-redux";
import TracerTable from "./TracerTable";
import DetailsViewer from "./DetailsViewer";
import TracerEventsTable from "./TracerEventsTable";
import FilterColumn from "./FilterColumn";
import RequestTable from "./RequestTable";
import NavSidebar from "./NavSidebar";
import Settings from "./Settings";
import RefreshButton from "./RefreshButton";
import { refresh, seenNotifications } from "../actions/index";
import "../styles/App.css";

const mapStateToProps = (state) => ({
  appInitialized: state.appInitialized,
    onSettingsPage: state.onSettingsPage,
    seenNotifications: state.seenNotifications,
});
const mapDispatchToProps = (dispatch) => ({
    refresh: () => dispatch(refresh(true)),
    hasSeenNotifications: () => dispatch(seenNotifications()),
});

const displayNotification = () => {
    const notif = "Hello Tracy-ers! Wanted"
    alert(notif)
}

class App extends Component {
  componentDidMount = () => {
      setInterval(() => this.props.refresh(), 5000);
  };
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
            <RefreshButton />
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
        <span>loading...</span>
      </div>
    );
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
