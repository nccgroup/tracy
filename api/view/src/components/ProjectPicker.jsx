import React, { Component } from "react";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import {
  delProject,
  getProjects,
  switchProject,
  getSavedProject
} from "../utils";

export default class ProjectPicker extends Component {
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
      <div>
        <label>Projects: </label>
        <select
          value={this.props.proj}
          onChange={this.selectProject}
          className="project-picker"
        >
          {opts}
        </select>
        <FontAwesomeIcon onClick={this.newProject} icon="plus" />
        <FontAwesomeIcon onClick={this.delProject} icon="minus" />
      </div>
    );
  }
}
