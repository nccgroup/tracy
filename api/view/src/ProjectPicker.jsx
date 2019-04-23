import React, { Component } from "react";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";

class ProjectPicker extends Component {
  newProject = _ => {
    const proj = prompt("Enter a new project name");
    if (this.props.projects.includes(proj)) {
      alert(
        "That project already exists. Make sure you pick a project with a unique name."
      );
      return;
    }
    if (proj) {
      this.switchProject(proj);
    }
  };

  deleteProject = _ => {
    this.props.deleteProject(this.props.selected);
  };

  switchProject = proj => {
    if (proj.target) {
      this.props.switchProject(proj.target.value);
      return;
    }
    this.props.switchProject(proj);
  };

  render() {
    const opts = this.props.projects.map((v, k) => {
      return <option key={k}>{v}</option>;
    });
    return (
      <Row>
        <Col md={2}>
          <label>projects: </label>
        </Col>
        <Col md={2}>
          <select
            value={this.props.selected}
            onChange={this.switchProject}
            className="project-picker"
          >
            {opts}
          </select>
        </Col>
        <Col md={8}>
          <div className="icon-button" href="#" onClick={this.newProject}>
            <FontAwesomeIcon icon="plus" />
          </div>
          <div className="icon-button" href="#" onClick={this.deleteProject}>
            <FontAwesomeIcon icon="minus" />
          </div>
        </Col>
      </Row>
    );
  }
}

export default ProjectPicker;
