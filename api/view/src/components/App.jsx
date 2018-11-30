import React, { Component } from "react";
import TracerTable from "../containers/TracerTable";
import DetailsViewer from "../containers/DetailsViewer";
import Header from "../containers/Header";
import TracerEventsTable from "../containers/TracerEventsTable";
import WebSocketRouter from "../containers/WebSocketRouter";
import Footer from "../containers/Footer";
import Col from "react-bootstrap/lib/Col";
import FilterColumn from "../components/FilterColumn";
import Row from "react-bootstrap/lib/Row";
import ProjectPicker from "../containers//ProjectPicker";
import "../styles/App.css";

export default class App extends Component {
  render() {
    return (
      <Row>
        <Col md={12} className="container">
          <Row className="header">
            <Header width={2} />
            <Col md={10}>
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
            </Col>
          </Row>
          <Row className="tables-row">
            <Col md={6} className="left-top-column">
              <TracerTable />
            </Col>
            <Col md={6} className="right-top-column">
              <TracerEventsTable />
            </Col>
          </Row>
          <Row className="raw-row">
            <Col className="raw-column" md={12}>
              <DetailsViewer />
            </Col>
          </Row>
          <Footer />
        </Col>
      </Row>
    );
  }
}
