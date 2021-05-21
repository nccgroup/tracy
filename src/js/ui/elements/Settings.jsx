import React from "react";
import { generateUUID } from "../../shared/ui-helpers";
import { channel } from "../../shared/channel-cs";
import { rpc } from "../../shared/rpc";
import { updateProjects, changeSetting } from "../actions/";
import { connect } from "react-redux";

const mapStateToProps = (state) => ({
  tracyEnabled: state.tracyEnabled,
  apiKey: state.apiKey,
  projName: state.projName,
  projs: state.projs,
  tracerPayloads: state.tracerPayloads,
});

const mapDispatchToProps = (dispatch) => ({
  updateProjects: (proj) => dispatch(updateProjects(proj)),
  changeSetting: (setting) => dispatch(changeSetting(setting)),
});

const createNewProject = (props) => {
  const p = prompt("Enter a new project name");
  if (props.projs.filter((p) => p.proj.name === p).length > 0) {
    alert("Make a unique name, there is already a project with that name.");
    return;
  }
  const proj = { proj: { name: p, apiKey: generateUUID() } };
  props.updateProjects(props.projs.concat(proj));
  props.changeSetting(proj);
};

const exportProject = async (props) => {
  const r = rpc(channel)
  let tracers = await r.getTracers()
  tracers = await Promise.all(tracers.map(async (tracer) => {
    const events = await r.getTracerEventsByPayload(tracer.TracerPayload)
    tracer.Events = await Promise.all(events.map(async (event) => {
      const rawEventBlobURL = await r.getRawEvent(event.ID)
      const resp = await fetch(rawEventBlobURL);
      const blob = await resp.blob();
      URL.revokeObjectURL(rawEventBlobURL);
      event.RawEvent = await blob.text();
      return event
    }))
    return tracer
  }))
  tracers = await Promise.all(tracers.map(async (tracer) => {
    const reader = new FileReader();
    const blob = await fetch(tracer.Screenshot).then(r => r.blob());
    return await new Promise((res) => {
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        tracer.Screenshot = reader.result;
        res(tracer)
      }
    });
  }))

  const blob = new Blob([JSON.stringify(tracers)], { type: "application/json" })
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `exported_project_${props.projName}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

const createFirstProject = (props) => {
  // When we create the first project, make sure an API key wasn't already
  // created for that project (can happen if you start to insert tracers before
  // the UI ever opens). If so, use that API key.
  chrome.storage.local.get({ apiKey: "" }, (o) => {
    let key = o.apiKey;
    if (!key) {
      key = generateUUID();
    }
    const proj = {
      proj: { name: "first project", apiKey: key },
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
    const proj = props.projs.filter((p) => p.proj.name === e.target.value).pop()
      .proj;
    s = {
      name: proj.name,
      apiKey: proj.apiKey,
    };
  }
  props.changeSetting({ [e.target.id]: s });
};

const addTracerPayload = (props) => {
  const tp = prompt(
    "Provide a tracer payload (the identifer for this type fo string)"
  );
  if (!tp) {
    return;
  }

  if (props.tracerPayloads.filter((t) => t[0] === tp).length > 0) {
    alert(
      "There already exists a tracer payload with that name. Pick something unique"
    );
    return;
  }
  const ts = prompt("Provide a tracer string (the tracer string template)");
  if (!ts) {
    return;
  }
  props.changeSetting({ addedTracerPayload: [tp, ts] });
};

const deleteTracerPayload = (ts, props) => {
  props.changeSetting({ deletedTracerPayload: ts });
};

const deleteProject = (props) => {
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
  const n = props.projs.filter((p) => p.proj.name !== props.projName);
  props.updateProjects(n);
  props.changeSetting(n[0]);
};

const importTracerPayload = () => {
  const tp = prompt("What is the tracer payload you want traced?");
  if (!tp || tp.length <= 6) {
    alert(
      "The tracer payload needs to be greater than 6 characters. Otherwise, Tracy will have a hard time searching for unique identifiers across pages"
    );
    return;
  }

  const r = rpc(channel);
  r.addTracer({
    TracerString: "IMPORTED",
    TracerPayload: tp,
    HasTracerEvents: false,
    Requests: [],
    Screenshot: null,
    Severity: 0,
  });
};

const Settings = (props) => {
  if (props.projs.length === 0) {
    createFirstProject(props);
  }

  return (
    <div
      className="settings-wrapper"
      style={props.hidden ? { display: "none" } : {}}
    >
      <h1>Settings</h1>
      <div className="settings-row">
        <h2>Tracer Strings and Payloads</h2>
        <span className="settings-describe-text">
          These are the strings and corresponding payloads that your Tracy
          dropdown can pick from. When creating tracer strings and payloads,
          there are a couple of things to know:
          <ol>
            <li>
              A tracer string simply maps to a tracer payload. When you select a
              tracer string from the Tracy dropdown, the tracer payload is what
              shows up in the input field. The tracer payload is also what Tracy
              remembers for future web application sinks.{" "}
            </li>
            <li>
              When picking a tracer payload, if you use the "<i>[[ID]]</i>"{" "}
              identifier, Tracy will automatically convert this identifier to a
              random unique character string that it will remember. You can
              create tracer payloads without the "<i>[[ID]]</i>", but I can't
              imagine them being very useful.
            </li>
            <li>
              Tracer payloads that start with the word "<i>GEN</i>" will be
              payloads that are generated on-the-fly into the page. This means
              they will be created before any JavaScript validation occurs on
              the page. If you want a payload that is generated after JavaScript
              validation (for example, right before the form is submitted or
              right before a fetch request goes out), simply create a payload
              that doesn't start with "<i>GEN</i>".
            </li>
          </ol>
        </span>
        <table>
          <thead>
            <tr>
              <th>Tracer String</th>
              <th>Tracer Payload</th>
            </tr>
          </thead>
          <tbody>
            {props.tracerPayloads.map((tp, i) => {
              return (
                <tr key={i} onClick={(e) => deleteTracerPayload(tp[0], props)}>
                  <td>{tp[0]}</td>
                  <td>{tp[1]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button onClick={() => addTracerPayload(props)}>
          Add New Tracer Payload
        </button>
      </div>
      <div className="settings-row">
        <h2>Import Tracer Payloads</h2>
        <span className="settings-describe-text">
          Ever see something in a page that you want traced, but Tracy doesn't
          know about it? This setting allows you to tell Tracy you want it to
          watch for an arbitrary tracer payload of your choosing. This can be
          helpful in a number of cases:
          <ol>
            <li>
              A sensitive value is rendered in the DOM (such as an API key) and
              you want Tracy to watch and alert whenever it is rendered again.
            </li>
            <li>
              Another teammate is also using Tracy and you want to instruct your
              version of Tracy to watch for payloads they have inserted. This
              may assist you in finding data sources that lead to injection
              sinks across tenant boundaries, such as data leaks between
              different user tenants or XSS that bleeds into other types of user
              accounts (such as a low privilege user and an customer service
              agent portal).
            </li>
            <li>
              Changing the value of a user-controlled input is too difficult and
              you'd like to watch that input as is.
            </li>
          </ol>
        </span>
        <button onClick={(e) => importTracerPayload()}>
          Import tracer payload
        </button>
      </div>
      <div className="settings-row">
        <h2>Export Data</h2>
        <span className="settings-describe-text">
          Export all the data from the current project in a JSON file.
	  </span>
        <button onClick={() => exportProject(props)}>Export data now</button>
      </div>
      <div className="settings-row">
        <h2>Projects</h2>
        <span className="settings-describe-text">
          These are your current Tracy projects. Each project comes with its own
          set of tracers to follow. You can swap between projects by selecting
          the project you choose from the dropdown below. You can also create
          and archive projects.
        </span>
        <select
          id="proj"
          value={props.projName}
          onChange={(e) => handleOnChange(e, props)}
        >
          {props.projs.map((p) => (
            <option key={p.proj.apiKey} value={p.proj.name}>
              {p.proj.name}
            </option>
          ))}
        </select>
        <br />
        <button onClick={() => createNewProject(props)}>
          Create new project
        </button>
        <button onClick={() => deleteProject(props)}>Delete project</button>
      </div>
      <div className="settings-row">
        <h2>Survey</h2>
        <span className="settings-describe-text">
          If you are looking to help make Tracy a bit better, please take 5 minutes to fill out the Google Form
          below to help me better understand how you use Tracy. I'd love to hear from you!
	  </span>
        <a href="https://forms.gle/gyjYU6VwSki6cMXD9">Take survey here</a>
      </div>
    </div>
  );
};
export default connect(mapStateToProps, mapDispatchToProps)(Settings);
