import React, { Component } from "react";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      extension: false
    };
  }
  onChange = e => {
    if (!window.tracy) {
      window.tracy = {};
    }
    if (e.target.id === "ui-host-config") {
      if (e.target.value === "") {
        window.tracy.host = "localhost";
      } else {
        window.tracy.host = e.target.value;
      }
    } else {
      if (e.target.value === "") {
        window.tracy.port = 8081;
      } else {
        window.tracy.port = e.target.value;
      }
    }
  };

  componentWillMount = () => {
    if (!window.tracy) {
      // Default configuration for the UI.
      window.tracy = {
        host: "localhost",
        port: 8081
      };

      return;
    }

    this.setState({ extension: true });
  };

  shouldComponentUpdate = (prevState, prevProps) => {
    return false;
  };

  render() {
    if (this.state.extension) {
      return <span />;
    }

    return (
      <Row>
        <Col md={6}>
          <input
            id="ui-host-config"
            onChange={this.onChange}
            placeholder={window.tracy.host}
            type="text"
          />
        </Col>
        <Col md={6}>
          <input
            id="ui-port-config"
            onChange={this.onChange}
            placeholder={window.tracy.port}
            type="text"
          />
        </Col>
      </Row>
    );
  }
}

export default Settings;
