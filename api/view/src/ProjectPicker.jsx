import React, { Component } from "react";
import Glyphicon from "react-bootstrap/lib/Glyphicon";

class ProjectPicker extends Component {
  newProject = _ => {
    const proj = prompt("Enter a new project name");
    if (this.props.projects.includes(proj)) {
      alert(
        "That project already exists. Make sure you pick a project with a unique name."
      );
      return;
    }
    this.switchProject(proj);
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
      <div>
        <label>Projects: </label>
        <select
          value={this.props.selected}
          onChange={this.switchProject}
          className="project-picker"
        >
          {opts}
        </select>
        <Glyphicon
          onClick={this.newProject}
          glyph="glyphicon glyphicon-plus-sign"
        />
        <Glyphicon
          onClick={this.deleteProject}
          glyph="glyphicon glyphicon-minus-sign"
        />
      </div>
    );
  }
}

export default ProjectPicker;
