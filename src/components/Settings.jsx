/* global chrome */
import React from "react";

// Stolen from : https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
const generateUUID = () =>
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );

const createNewProject = props => {
  const p = prompt("Enter a new project name");
  if (props.projs.filter(p => p.proj.name === p).length > 0) {
    alert("Make a unique name, there is already a project with that name.");
    return;
  }
  const proj = { proj: { name: p, apiKey: generateUUID() } };
  props.updateProjects(props.projs.concat(proj));
  props.changeSetting(proj);
};

const createFirstProject = props => {
  // When we create the first project, make sure an API key wasn't already
  // created for that project (can happen if you start to insert tracers before
  // the UI ever opens). If so, use that API key.
  chrome.storage.local.get({ apiKey: "" }, o => {
    let key = o.apiKey;
    if (!key) {
      key = generateUUID();
    }
    const proj = {
      proj: { name: "first project", apiKey: key }
    };
    props.updateProjects(props.projs.concat(proj));
    props.changeSetting(proj);
  });
};

const handleOnChange = (e, props) => {
  let s;
  if (e.target.type === "checkbox") {
    s = e.target.checked;
  } else {
    s = e.target.value;
  }
  if (e.target.id === "proj") {
    const proj = props.projs.filter(p => p.proj.name === e.target.value).pop()
      .proj;
    s = {
      name: proj.name,
      apiKey: proj.apiKey
    };
  }
  props.changeSetting({ [e.target.id]: s });
};

const deleteProject = props => {
  const didConfirm = window.confirm(
    `Are you sure you want to delete project ${props.projName}?`
  );

  if (!didConfirm) {
    return;
  }

  if (props.projs.length === 1) {
    alert("You need at least one project.");
    return;
  }
  const n = props.projs.filter(p => p.proj.name !== props.projName);
  props.updateProjects(n);
  props.changeSetting(n[0]);
};

const Settings = props => {
  if (props.projs.length === 0) {
    createFirstProject(props);
  }

  return (
    <div
      className="settings-wrapper"
      style={props.hidden ? { display: "none" } : {}}
    >
      <div className="settings-row">
        <h4>Tracy Enabled</h4>
        <input
          type="checkbox"
          id="tracyEnabled"
          checked={props.tracyEnabled}
          onChange={e => handleOnChange(e, props)}
        />
      </div>
      <div className="settings-row">
        <h4>Project</h4>
        <select
          id="proj"
          value={props.projName}
          onChange={e => handleOnChange(e, props)}
        >
          {props.projs.map(p => (
            <option key={p.proj.apiKey} value={p.proj.name}>
              {p.proj.name}
            </option>
          ))}
        </select>
        <button onClick={() => createNewProject(props)}>
          Create new project
        </button>
        <button onClick={() => deleteProject(props)}>Delete project</button>
      </div>
    </div>
  );
};
export default Settings;
