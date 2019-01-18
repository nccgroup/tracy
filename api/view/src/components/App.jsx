import React, { Component } from "react";
import TracerTable from "../containers/TracerTable";
import DetailsViewer from "../containers/DetailsViewer";
import Header from "../containers/Header";
import TracerEventsTable from "../containers/TracerEventsTable";
import WebSocketRouter from "../containers/WebSocketRouter";
import Footer from "../containers/Footer";
import FilterColumn from "../components/FilterColumn";
import ProjectPicker from "../containers//ProjectPicker";
import TracyLogo from "../components/TracyLogo";
import "../styles/App.css";

export default class App extends Component {
  render() {
    return (
      <div className="app-with-sidebar">
        <div className="nav-sidebar">
          <TracyLogo />
        </div>
        <div className="tables">
          <TracerTable />
          <TracerEventsTable />
        </div>
        <DetailsViewer />
      </div>
    );
  }
}
/*
          <Row>
            <Col>
              <DetailsViewer />
            </Col>
          </Row>
          <Footer />

 <Row>
                <Col md={6} />
                <Col md={3}>
                  <ProjectPicker />
                </Col>
                <Col md={2}>
                  <Row>
                    <Col md={3} />
                    <Col md={9}>
                      <WebSocketRouter />
                    </Col>
                  </Row>
                </Col>
                <Col md={1}>
                  <FilterColumn />
                </Col>
              </Row>
 */
