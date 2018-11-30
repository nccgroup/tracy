const SELECT_PROJ = "SELECT_PROJ";
const UPDATE_PROJECTS = "UPDATE_PROJECT";
const DEL_PROJECT = "DEL_PROJECT";
const SELECT_TRACER = "SELECT_TRACER";
const ADD_TRACER = "ADD_TRACER";
const ADD_REQUEST = "ADD_REQUEST";
const UPDATE_TRACERS = "UPDATE_TRACERS";
const SELECT_EVENT = "SELECT_EVENT";
const UPDATE_EVENTS = "UPDATE_EVENTS";
const ADD_EVENT = "ADD_EVENT";
const TOGGLE_LOADING_EVENTS = "TOGGLE_LOADING_EVENTS";
const TOGGLE_LOADING_TRACERS = "TOGGLE_LOADING_TRACERS";
const TOGGLE_INACTIVE_FILTER = "TOGGLE_INACTIVE_FILTER";
const TOGGLE_HTTP_RESPONSE_FILTER = "TOGGLE_HTTP_RESPONSE_FILTER";
const TOGGLE_TEXT_FILTER = "TOGGLE_TEXT_FILTER";
const TOGGLE_WEBSOCKET_CONNECTED = "TOGGLE_WEBSOCKET_CONNECTED";
const TOGGLE_WEBSOCKET_DISCONNECTED = "TOGGLE_WEBSOCKET_DISCONNECTED";
const START_REPRODUCTION = "START_REPRODUCTION";

const addTracer = tracer => {
  return {
    type: ADD_TRACER,
    tracer: tracer
  };
};

const updateTracers = tracers => {
  return {
    type: UPDATE_TRACERS,
    tracers: tracers
  };
};

const addRequest = req => {
  return {
    type: ADD_REQUEST,
    req: req
  };
};

const addEvent = event => {
  return {
    type: ADD_EVENT,
    event: event
  };
};

const delProject = i => {
  return {
    type: DEL_PROJECT,
    i: i
  };
};

const selectTracer = id => {
  return {
    type: SELECT_TRACER,
    id: id
  };
};

const selectEvent = id => {
  return {
    type: SELECT_EVENT,
    id: id
  };
};

const updateEvents = events => {
  return {
    type: UPDATE_EVENTS,
    events: events
  };
};

const startReproduction = () => {
  return {
    type: START_REPRODUCTION
  };
};

const toggleFilter = type => {
  switch (type) {
    case TOGGLE_INACTIVE_FILTER:
      return toggleInactiveFilter();
    case TOGGLE_HTTP_RESPONSE_FILTER:
      return toggleHTTPResponseFilter();
    case TOGGLE_TEXT_FILTER:
      return toggleTextFilter();
  }
};

const toggleInactiveFilter = () => {
  return {
    type: TOGGLE_INACTIVE_FILTER
  };
};

const toggleHTTPResponseFilter = () => {
  return {
    type: TOGGLE_HTTP_RESPONSE_FILTER
  };
};

const toggleTextFilter = () => {
  return {
    type: TOGGLE_TEXT_FILTER
  };
};

const webSocketDisconnect = () => {
  return {
    type: TOGGLE_WEBSOCKET_DISCONNECTED
  };
};

const webSocketConnect = () => {
  return {
    type: TOGGLE_WEBSOCKET_CONNECTED
  };
};

const updateProjects = projs => {
  return {
    type: UPDATE_PROJECTS,
    projs: projs
  };
};

const selectProject = proj => {
  return {
    type: SELECT_PROJ,
    proj: proj
  };
};

export {
  webSocketDisconnect,
  webSocketConnect,
  updateTracers,
  selectProject,
  updateProjects,
  selectTracer,
  toggleFilter,
  selectEvent,
  startReproduction,
  delProject,
  addTracer,
  addRequest,
  addEvent,
  updateEvents,
  START_REPRODUCTION,
  SELECT_PROJ,
  UPDATE_PROJECTS,
  DEL_PROJECT,
  SELECT_TRACER,
  ADD_TRACER,
  ADD_REQUEST,
  UPDATE_TRACERS,
  SELECT_EVENT,
  UPDATE_EVENTS,
  ADD_EVENT,
  TOGGLE_INACTIVE_FILTER,
  TOGGLE_HTTP_RESPONSE_FILTER,
  TOGGLE_TEXT_FILTER,
  TOGGLE_WEBSOCKET_CONNECTED,
  TOGGLE_WEBSOCKET_DISCONNECTED
};
