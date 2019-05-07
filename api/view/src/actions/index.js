export const SELECT_PROJ = "SELECT_PROJ";
export const UPDATE_PROJECTS = "UPDATE_PROJECT";
export const DEL_PROJECT = "DEL_PROJECT";
export const SELECT_TRACER = "SELECT_TRACER";
export const ADD_TRACER = "ADD_TRACER";
export const ADD_REQUEST = "ADD_REQUEST";
export const UPDATE_TRACERS = "UPDATE_TRACERS";
export const SELECT_EVENT = "SELECT_EVENT";
export const UPDATE_EVENTS = "UPDATE_EVENTS";
export const ADD_EVENT = "ADD_EVENT";
export const TOGGLE_LOADING_EVENTS = "TOGGLE_LOADING_EVENTS";
export const TOGGLE_LOADING_TRACERS = "TOGGLE_LOADING_TRACERS";
export const TOGGLE_INACTIVE_FILTER = "TOGGLE_INACTIVE_FILTER";
export const TOGGLE_HTTP_RESPONSE_FILTER = "TOGGLE_HTTP_RESPONSE_FILTER";
export const TOGGLE_TEXT_FILTER = "TOGGLE_TEXT_FILTER";
export const TOGGLE_WEBSOCKET_CONNECTED = "TOGGLE_WEBSOCKET_CONNECTED";
export const TOGGLE_WEBSOCKET_DISCONNECTED = "TOGGLE_WEBSOCKET_DISCONNECTED";
export const START_REPRODUCTION = "START_REPRODUCTION";
export const CHANGE_TAB = "CHANGE_TAB";
export const ADD_API_KEY = "ADD_API_KEY";

export const addAPIKey = apiKey => {
  return {
    type: ADD_API_KEY,
    apiKey: apiKey
  };
};

export const changeTab = tabID => {
  return {
    type: CHANGE_TAB,
    tabID: tabID
  };
};

export const addTracer = tracer => {
  return {
    type: ADD_TRACER,
    tracer: tracer
  };
};

export const updateTracers = tracers => {
  return {
    type: UPDATE_TRACERS,
    tracers: tracers
  };
};

export const addRequest = req => {
  return {
    type: ADD_REQUEST,
    req: req
  };
};

export const addEvent = event => {
  return {
    type: ADD_EVENT,
    event: event
  };
};

export const delProject = i => {
  return {
    type: DEL_PROJECT,
    i: i
  };
};

export const selectTracer = id => {
  return {
    type: SELECT_TRACER,
    id: id
  };
};

export const selectEvent = id => {
  return {
    type: SELECT_EVENT,
    id: id
  };
};

export const updateEvents = events => {
  return {
    type: UPDATE_EVENTS,
    events: events
  };
};

export const startReproduction = () => {
  return {
    type: START_REPRODUCTION
  };
};

export const toggleFilter = type => {
  switch (type) {
    case TOGGLE_INACTIVE_FILTER:
      return toggleInactiveFilter();
    case TOGGLE_HTTP_RESPONSE_FILTER:
      return toggleHTTPResponseFilter();
    case TOGGLE_TEXT_FILTER:
      return toggleTextFilter();
    default:
      console.error("PANIC");
  }
};

export const toggleInactiveFilter = () => {
  return {
    type: TOGGLE_INACTIVE_FILTER
  };
};

export const toggleHTTPResponseFilter = () => {
  return {
    type: TOGGLE_HTTP_RESPONSE_FILTER
  };
};

export const toggleTextFilter = () => {
  return {
    type: TOGGLE_TEXT_FILTER
  };
};

export const webSocketDisconnect = () => {
  return {
    type: TOGGLE_WEBSOCKET_DISCONNECTED
  };
};

export const webSocketConnect = () => {
  return {
    type: TOGGLE_WEBSOCKET_CONNECTED
  };
};

export const updateProjects = projs => {
  return {
    type: UPDATE_PROJECTS,
    projs: projs
  };
};

export const selectProject = proj => {
  return {
    type: SELECT_PROJ,
    proj: proj
  };
};
