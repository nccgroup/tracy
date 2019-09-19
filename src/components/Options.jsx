/* global chrome */
import React from "react";

export default class Options extends React.Component {
  // Stolen from : https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  generateUUID = () =>
    ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );

  handleOnChange = e => {
    let s;
    if (e.target.type === "checkbox") {
      s = { [e.target.id]: e.target.checked };
    } else {
      s = { [e.target.id]: e.target.value };
    }
    if (e.target.id === "proj") {
      s = {
        proj: {
          name: e.target.value,
          apiKey: [...e.target.options]
            .filter(e => e.selected)
            .pop()
            .getAttribute("data-api-key")
        }
      };
    }
    this.props.changeSetting(s);
  };
  createNewProject = () => {
    const p = prompt("Enter a new project name");
    const proj = { proj: { name: p, apiKey: this.generateUUID() } };
    this.props.updateProjects(this.props.projs.concat(proj));
    this.props.changeSetting(proj);
  };
  componentDidMount = () => {
    if (this.props.projs.length === 0) {
      this.createFirstProject();
    }
  };

  createFirstProject = () => {
    // When we create the first project, make sure an API key wasn't already
    // created for that project (can happen if you start to insert tracers before
    // the UI ever opens). If so, use that API key.
    chrome.storage.local.get({ apiKey: "" }, o => {
      let key = o.apiKey;
      if (!key) {
        key = this.generateUUID();
      }
      const proj = {
        proj: { name: "first project", apiKey: key }
      };
      this.props.updateProjects(this.props.projs.concat(proj));
      this.props.changeSetting(proj);
    });
  };

  render = () => (
    <div style={this.props.hidden ? { display: "none" } : {}}>
      <h3>Tracy Enabled</h3>
      <input
        type="checkbox"
        id="tracyEnabled"
        checked={this.props.tracyEnabled}
        onChange={this.handleOnChange}
      />
      <h3>Project</h3>
      <select
        id="proj"
        value={this.props.projName}
        onChange={this.handleOnChange}
      >
        {this.props.projs.map(p => (
          <option
            key={p.proj.apiKey}
            data-api-key={p.proj.apiKey}
            value={p.proj.name}
          >
            {p.proj.name}
          </option>
        ))}
      </select>
      <button onClick={this.createNewProject}>Create new project</button>
      <br />
      <br />
      <button onClick={this.props.navigateToUIPage}>Back</button>
    </div>
  );
}
