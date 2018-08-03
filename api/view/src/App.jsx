import React, { Component } from "react";
import TracerTable from "./TracerTable";
import DetailsViewer from "./DetailsViewer";
import Header from "./Header";
import TracerEventsTable from "./TracerEventsTable";
import WebSocketRouter from "./WebSocketRouter";
import Footer from "./Footer";
import Col from "react-bootstrap/lib/Col";
import FilterColumn from "./FilterColumn";
import Row from "react-bootstrap/lib/Row";
import ProjectPicker from "./ProjectPicker";
import Settings from "./Settings";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [], //the available projects to pick from
      project: "", // the currently selected project
      ptracers: [], //formatted tracers
      tracers: [], //raw tracers
      tracer: {}, //currently selected tracer
      pevents: [], //formatted events
      events: [], //raw events
      event: {}, //currently selected tracers
      loading: false, //loading status
      filters: {
        inactive: false,
        responses: false,
        text: false
      }
    };
  }

  /* Helper  to return the URL query parameters as a comma-separated list. */
  parseURLParameters(url) {
    var ret;
    var splitOnParam = url.split("?");
    if (splitOnParam.length > 1) {
      ret = splitOnParam[1].replace("&", ", ");
    } else {
      ret = "";
    }

    return ret;
  }

  /* Helper  to return the hostname from a URL string. */
  parseHost(url) {
    var ret;

    // In case the url has a protocol, remove it.
    var protocolSplit = url.split("://");
    var withoutProtocol;
    if (protocolSplit.length > 1) {
      withoutProtocol = protocolSplit[1];
    } else {
      withoutProtocol = protocolSplit[0];
    }

    var host = withoutProtocol.split("?")[0];
    var pathIndex = host.indexOf("/");

    if (pathIndex !== -1) {
      ret = host.substring(0, pathIndex);
    } else {
      ret = host;
    }

    return ret;
  }

  /* Helper  to return the path from a URL string. */
  parsePath(url) {
    var ret = "";

    // In case the url has a protocol, remove it.
    var protocolSplit = url.split("://");
    var withoutProtocol;
    if (protocolSplit.length > 1) {
      withoutProtocol = protocolSplit[1];
    } else {
      withoutProtocol = protocolSplit[0];
    }

    var host = withoutProtocol.split("?")[0];
    var pathIndex = host.indexOf("/");
    if (pathIndex !== -1) {
      ret = host.substring(pathIndex, host.length);
    } else {
      ret = "/";
    }

    return ret;
  }

  // Mesage the request objects into a set of tracer data structure so the
  // table can read their columns.
  formatRequest = request => {
    if (request.Tracers) {
      return request.Tracers.map(t => this.formatTracer(t, request));
    }
  };

  // formatTracer returns a new tracer object with some its fields
  // changed to be read better by the tables.
  formatTracer = (tracer, request) => {
    if (request) {
      return {
        ID: tracer.ID,
        RawRequest: request.RawRequest,
        RequestMethod: request.RequestMethod,
        RequestURL: this.parseHost(request.RequestURL),
        RequestPath: this.parsePath(request.RequestURL),
        TracerString: tracer.TracerString,
        TracerPayload: tracer.TracerPayload,
        TracerLocationIndex: tracer.TracerLocationIndex,
        TracerLocationType: tracer.TracerLocationType,
        OverallSeverity: tracer.OverallSeverity,
        HasTracerEvents: tracer.HasTracerEvents
      };
    }

    return {
      ID: tracer.ID,
      RawRequest: "n/a",
      RequestMethod: "n/a",
      RequestURL: "n/a",
      RequestPath: "n/a",
      TracerString: tracer.TracerString,
      TracerPayload: tracer.TracerPayload,
      TracerLocationIndex: tracer.TracerLocationIndex,
      TracerLocationType: tracer.TracerLocationType,
      OverallSeverity: tracer.OverallSeverity,
      HasTracerEvents: tracer.HasTracerEvents
    };
  };

  /* Format all the event contexts into their corresponding columns. */
  formatEvent(event, eidx) {
    // Enum to human-readable structure to translate the various DOM contexts.
    const locationTypes = {
      0: "attribute name",
      1: "text",
      2: "node name",
      3: "attribute value",
      4: "comment block"
    };

    var ret = [];
    if (event.DOMContexts && event.DOMContexts.length > 0) {
      ret = event.DOMContexts.map(
        function(context, cidx) {
          return {
            HTMLLocationType: locationTypes[context.HTMLLocationType],
            HTMLNodeType: context.HTMLNodeType,
            EventContext: context.EventContext,
            RawEvent: event.RawEvent.Data,
            RawEventIndex: cidx,
            EventType: event.EventType,
            EventHost: this.parseHost(event.EventURL),
            EventPath: this.parsePath(event.EventURL),
            Severity: context.Severity,
            Reason: context.Reason
          };
        }.bind(this)
      );
    } else {
      // If there are no DOMContexts, it is most likely an HTTP response.
      return {
        HTMLLocationType: "n/a",
        HTMLNodeType: "n/a",
        EventContext: "n/a",
        RawEvent: event.RawEvent.Data,
        RawEventIndex: 0, // this isn't really correct. there could be a case where there are two of the same tracer in an HTTP response
        EventType: event.EventType,
        EventHost: this.parseHost(event.EventURL),
        EventPath: this.parsePath(event.EventURL),
        Severity: 0
      };
    }

    return ret;
  }

  /* Given an event, give it an ID. */
  enumerate(event, id) {
    event.ID = id + 1;

    return event;
  }

  formatRowSeverity(row, rowIdx) {
    // Enum to human-readable structure to translate the different severity ratings.
    const severity = {
      0: "unexploitable",
      1: "suspicious",
      2: "probable",
      3: "exploitable"
    };
    return severity[row.OverallSeverity];
  }

  /* getProjects gets the projects available to view. */
  getProjects = () => {
    const req = this.newTracyRequest(`/projects`, {
      method: "GET"
    });

    fetch(req)
      .then(response => {
        if (!response.ok) {
          throw new Error("Was not able to make connection to /projects");
        }
        return response.json();
      })
      .then(response => {
        try {
          if (
            JSON.stringify(this.state.projects) !== JSON.stringify(response)
          ) {
            this.setState({ projects: response });
          }
        } catch (e) {
          // Probably an error with parsing the JSON.
          console.error(e);
        }
      })
      .catch(error => {
        console.error(error);
        setTimeout(this.getProjects, 1500);
      }); // If the API isn't up, retry until it comes up;}
  };

  /* Gets the bulk tracers via an HTTP GET request. */
  getTracers = () => {
    /* Create the HTTP GET request to the /tracers API endpoint. */
    const req = this.newTracyRequest(`/tracers`, {
      method: "GET"
    });

    fetch(req)
      .then(response => {
        if (!response.ok) {
          throw new Error("Was not able to make connection /tracers");
        }
        return response.json();
      })
      .then(response => {
        try {
          if (JSON.stringify(this.state.tracers) !== JSON.stringify(response)) {
            this.setState({
              tracers: response,
              ptracers: this.parseVisibleTracers(response, this.state.filters)
            });
          }
        } catch (e) {
          // Probably an error with parsing the JSON.
          console.error(e);
        }
      })
      .catch(error => {
        console.error(error);
        setTimeout(this.getTracers, 1500); // If the API isn't up, retry until it comes up);
      });
  };

  /* Gets the bulk events via an HTTP GET request. */
  getTracerEvents = (tracerID = this.state.tracer.ID, callback) => {
    // By default, the app starts with non of the tracers selected. Don't make a
    // request in this case.
    if (tracerID) {
      const req = this.newTracyRequest(`/tracers/${tracerID}/events`, {
        method: "GET"
      });

      fetch(req)
        .then(response => response.json())
        .catch(error => setTimeout(this.getTracerEvents, 1500)) // If the API isn't up, retry until it comes up
        .then(response => {
          this.setState(
            {
              events: response,
              pevents: this.parseVisibleEvents(response, this.state.filters),
              loading: false
            },
            () => {
              if (callback) callback();
            }
          );
        });
    }
  };

  /* Converts raw tracers into tracers that can be read by the table. */
  parseVisibleTracers(requests = [], sfilters = {}) {
    let ret = [];
    if (requests.length > 0) {
      const parsedTracers = [].concat
        .apply([], requests.map(n => this.formatRequest(n)))
        .filter(n => n);

      const tracerFilterKeys = ["archivedTracers", "inactive"];
      // Apply filters from the filter column component.
      const filters = Object.keys(sfilters).filter(
        n => sfilters[n] && tracerFilterKeys.includes(n)
      );

      ret = filters.reduce((accum, cur) => {
        return accum.filter(sfilters[cur]);
      }, parsedTracers);
    }
    return ret;
  }

  /* Converts raw events into events that can be read by the table. */
  parseVisibleEvents(events = [], sfilters = {}) {
    let ret = [];
    if (events.length > 0) {
      const parsedEvents = [].concat
        .apply([], events.map(this.formatEvent.bind(this)))
        .map(this.enumerate)
        .filter(n => n);

      const contextFilterKeys = [
        "responses",
        "exploitable",
        "archivedContexts",
        "text"
      ];

      // Apply filters from the filter column component.
      const filters = Object.keys(sfilters).filter(
        n => sfilters[n] && contextFilterKeys.includes(n)
      );

      ret = filters.reduce((accum, cur) => {
        return accum.filter(sfilters[cur]);
      }, parsedEvents);
    }
    return ret;
  }

  /* Called whenever one of the filter buttons is toggled. */
  handleFilterChange = (evt, filter) => {
    const contextFilterKeys = [
      "responses",
      "exploitable",
      "archivedContexts",
      "text"
    ];
    const tracerFilterKeys = ["archivedTracers", "inactive"];
    this.setState((prevState, props) => {
      //Change the filter
      prevState.filters[evt] = filter;

      //Apply the filters
      if (contextFilterKeys.includes(evt)) {
        prevState.pevents = this.parseVisibleEvents(
          prevState.events,
          prevState.filters
        );
      } else if (tracerFilterKeys.includes(evt)) {
        prevState.ptracers = this.parseVisibleTracers(
          prevState.tracers,
          prevState.filters
        );
      }

      return prevState;
    });
  };

  /* Called whenever a new tracer row is selected. */
  handleTracerSelection = (nTracer, callback) => {
    if (nTracer.ID !== this.state.tracer.ID) {
      this.setState({
        tracer: nTracer._original ? nTracer._original : nTracer,
        loading: true,
        events: [],
        pevents: [],
        event: {}
      });

      this.getTracerEvents(nTracer.ID, callback);
    }
  };

  /* Called whenever a new event is select. */
  handleEventSelection = nEvent => {
    if (nEvent.ID !== this.state.event.ID) {
      this.setState({
        event: nEvent._original ? nEvent._original : nEvent
      });
    }
  };

  /*handleNewTracer handles websocket messages that report new tracers. */
  handleNewTracer = nTracer => {
    let data = JSON.parse(nTracer.data)["Tracer"];
    this.setState((prevState, props) => {
      let match = [].concat
        .apply([], prevState.tracers.map(n => n.Tracers))
        .filter(n => n.ID === data.ID);
      if (match.length === 1) {
        match = match[0];
        Object.keys(data).map(n => {
          if (data[n] !== match[n]) {
            match[n] = data[n];
            return n;
          }
          return null;
        });
      }
      prevState.ptracers = this.parseVisibleTracers(
        prevState.tracers,
        prevState.filters
      );
      return prevState;
    });
  };

  /*handleNewRequest handles websocket messages that report new requests. */
  handleNewRequest = nRequest => {
    let data = JSON.parse(nRequest.data)["Request"];
    this.setState((prevState, props) => {
      let match = prevState.tracers.filter(n => n.ID === data.ID);
      if (match.length === 1) {
        match = match[0];
        Object.keys(data).map(n => {
          if (data[n] !== match[n]) {
            match[n] = data[n];

            //If the key was the RawRequest, we need to update the currently selected tracer
            //with this value as well.
            if (n === "RawRequest") {
              //If the matched request has a tracer that is currently selected...
              let selected = match.Tracers.filter(
                m => m.ID === prevState.tracer.ID
              );
              if (selected.length === 1) {
                prevState.tracer.RawRequest = data[n];
              }
            }
            return n;
          }
          return null;
        });
      } else {
        prevState.tracers.push(data);
        prevState.ptracers = this.parseVisibleTracers(
          prevState.tracers,
          prevState.filters
        );
      }
      return prevState;
    });
  };

  /*handleNewEvent handles websocket messages that report a new event for the currently selected tracer. */
  handleNewEvent = nEvent => {
    let data = JSON.parse(nEvent.data)["TracerEvent"];
    this.setState((prevState, props) => {
      let match = prevState.events.filter(n => n.ID === data.ID);
      if (match.length === 1) {
        match = match[0];
        Object.keys(data).map(n => {
          if (data[n] !== match[n]) {
            match[n] = data[n];
            return n;
          }
          return null;
        });
      } else {
        prevState.events.push(data);
        prevState.pevents = this.parseVisibleEvents(
          prevState.events,
          prevState.filters
        );
      }
      return prevState;
    });
  };

  // newFindingNotification checks the browser supports notifications,
  // then either asks permission for notifications, or displays the
  // formatted notification if the user has already granted permission.
  handleNotification = (tracer, context, event) => {
    if (!("Notification" in window)) {
      console.error("This browser does not support desktop notification");
      return;
    }

    if (Notification.permission === "granted") {
      // Let's check whether notification permissions have already been granted
      // If it's okay let's create a notification
      this.tracyNotification(tracer, context, event);
    } else if (Notification.permission !== "denied") {
      // Otherwise, we need to ask the user for permission
      Notification.requestPermission(permission => {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          this.tracyNotification(tracer, context, event);
        }
      });
    }
  };

  // tracyNotification creates a notification with the tracy logo
  // and standard default options, such as requiring interaction.
  tracyNotification = (tracer, context, event) => {
    const title = "Tracy found XSS!";
    const body = `Tracer Payload: ${tracer.TracerPayload}
Severity: ${context.Severity}
HTML Parent Tag: ${context.HTMLNodeType}`;
    const opts = {
      body: body,
      icon:
        "https://user-images.githubusercontent.com/16947503/38943629-c354d81a-42e6-11e8-9644-cc956d92fbcc.png",
      requireInteraction: true,
      sticky: true
    };

    const n = new Notification(title, opts);
    n.onclick = e => {
      const match_t = this.state.ptracers.filter(
        t => t.TracerPayload === tracer.TracerPayload
      );
      if (match_t.length === 1) {
        this.handleTracerSelection(match_t[0], () => {
          const match_e = this.state.pevents.filter(
            e =>
              e.RawEvent === event.RawEvent.Data &&
              e.EventType === event.EventType &&
              e.HTMLNodeType === context.HTMLNodeType
          );

          if (match_e.length === 1) {
            this.handleEventSelection(match_e[0]);
          }
        });
      }
    };
  };

  /* When the app loads, make an HTTP request for the latest set of tracers and 
   * projects. */
  componentDidMount() {
    this.getProjects();
    const proj = this.getSavedProject();
    if (proj !== null) {
      this.setState({
        project: proj
      });
      this.switchProject(proj);
    }
  }

  deleteProject = proj => {
    const req = this.newTracyRequest(`/projects?proj=${proj}`, {
      method: "DELETE"
    });

    fetch(req)
      .then(response => {
        if (!response.ok) {
          throw new Error(
            "Was not able to make connection to DELETE /projects"
          );
        }
        const i = this.state.projects.indexOf(proj);
        if (i !== -1) {
          this.switchProject(this.state.projects[i + 1]);
          this.setState((prevState, props) => {
            prevState.projects.splice(i, 1);
            return prevState;
          });
        }
      })
      .catch(err => console.error(err));
  };

  getSavedProject = () => {
    return localStorage.getItem("project");
  };
  saveProject = proj => {
    localStorage.setItem("project", proj);
  };

  newTracyRequest = (path, opts) => {
    if (!window.tracy || !window.tracy.host || !window.tracy.port) {
      console.error("the `window.tracy` object hasn't been set yet");
      return false;
    }
    if (!opts.headers) {
      opts.headers = {};
    }
    opts.headers.Hoot = "!";
    return new Request(
      `http://${window.tracy.host}:${window.tracy.port}${path}`,
      opts
    );
  };

  switchProject = proj => {
    const req = this.newTracyRequest(`/projects?proj=${proj}`, {
      method: "PUT"
    });

    fetch(req)
      .then(response => {
        if (!response.ok) {
          throw new Error("Was not able to make connection to /projects");
        }

        this.saveProject(proj);
        this.setState((prevState, props) => {
          if (!prevState.projects.includes(proj)) {
            prevState.projects.push(proj);
          }
          prevState.project = proj;
          prevState.ptracers = [];
          prevState.tracers = [];
          prevState.tracer = {};
          prevState.pevents = [];
          prevState.events = [];
          prevState.event = {};
          return prevState;
        });

        this.getTracers();
      })
      .catch(err => console.error(err));
  };

  render() {
    return (
      <Row>
        <Col md={12} className="container">
          <Row className="header">
            <Header width={2} />
            <Col md={10}>
              <Row>
                <Col md={2} />
                <Col md={5}>
                  <Settings />
                </Col>
                <Col md={2}>
                  <ProjectPicker
                    deleteProject={this.deleteProject}
                    switchProject={this.switchProject}
                    selected={this.state.project}
                    projects={this.state.projects}
                  />
                </Col>
                <Col md={2}>
                  <WebSocketRouter
                    handleNewTracer={this.handleNewTracer}
                    handleNewRequest={this.handleNewRequest}
                    handleNewEvent={this.handleNewEvent}
                    handleNotification={this.handleNotification}
                    tracer={this.state.tracer}
                  />
                </Col>
                <Col md={1}>
                  <FilterColumn handleFilterChange={this.handleFilterChange} />
                </Col>
              </Row>
            </Col>
          </Row>
          <Row className="tables-row">
            <Col md={6} className="left-top-column">
              <TracerTable
                tracers={this.state.ptracers}
                selectedTracerID={this.state.tracer.ID}
                handleTracerSelection={this.handleTracerSelection}
              />
            </Col>
            <Col md={6} className="right-top-column">
              <TracerEventsTable
                selectedEventID={
                  Object.keys(this.state.event).length === 0
                    ? -1
                    : this.state.event.ID
                }
                events={this.state.pevents}
                tracer={this.state.tracer}
                loading={this.state.loading}
                handleEventSelection={this.handleEventSelection}
              />
            </Col>
          </Row>
          <Row className="raw-row">
            <Col className="raw-column" md={12}>
              <DetailsViewer
                tracer={this.state.tracer}
                event={this.state.event}
              />
            </Col>
          </Row>
          <Footer />
        </Col>
      </Row>
    );
  }
}

export default App;
