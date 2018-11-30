import React, { Component } from "react";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import {
  delProject,
  getProjects,
  switchProject,
  getSavedProject
} from "../utils";

class ProjectPicker extends Component {
  // When the app loads, make an HTTP request for the latest set of tracers and
  // projects.
  componentDidMount = () => {
    getProjects().then(projs => {
      this.props.updateProjects(projs);

      const proj = getSavedProject();
      if (proj === null) {
        this.props.selectProject(projs[0]);
        return;
      }

      switchProject(proj).then(_ => {
        this.props.selectProject(proj);
      });
    });
  };

  // newProject prompts the user for a name and
  // creates a new project with that name.
  newProject = async () => {
    const proj = prompt("Enter a new project name");
    if (this.props.projs.includes(proj)) {
      alert(
        "That project already exists. Make sure you pick a project with a unique name."
      );
      return;
    }

    if (!proj) {
      return;
    }

    await switchProject(proj);
    this.props.updateProjects(this.props.projs.concat(proj));
    this.selectProject(proj);
  };

  // delProject finds the ID for the project being deleted,
  // removes it from the store and then switches to the
  // next project in line.
  delProject = async () => {
    let i = this.props.projs.indexOf(this.props.proj);
    this.props.delProject(i);
    delProject(i);
    // Be default, switch the project below it. If the project was the last
    // element in the list, wrap around.
    if (i !== -1) {
      i = (i + 1) % this.props.projs.length;
    }
    this.switchProject(this.props.proj[i]);
  };

  // selectProject does some formatting and then
  // dispatches an event to select the project.
  selectProject = proj => {
    if (proj.target) {
      this.props.selectProject(proj.target.value);
      return;
    }
    this.props.selectProject(proj);
  };

  render() {
    const opts = this.props.projs.map((v, k) => {
      return <option key={k}>{v}</option>;
    });
    return (
      <Row>
        <Col md={4} />
        <Col md={2}>
          <label>Projects: </label>
        </Col>
        <Col md={4}>
          <select
            value={this.props.proj}
            onChange={this.selectProject}
            className="project-picker"
          >
            {opts}
          </select>
        </Col>
        <Col md={2}>
          <Glyphicon
            onClick={this.newProject}
            glyph="glyphicon glyphicon-plus-sign"
          />

          <Glyphicon
            onClick={this.delProject}
            glyph="glyphicon glyphicon-minus-sign"
          />
        </Col>
      </Row>
    );
  }
}

export default ProjectPicker;
