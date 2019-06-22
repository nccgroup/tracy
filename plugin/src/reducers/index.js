/* global chrome */
import * as actions from "../actions";
import * as utils from "../utils";

const init = {
  proj: {},
  projs: [],
  tracers: [],
  events: [],
  tracersLoading: true,
  eventsLoading: false,
  selectedEventID: -1,
  selectedTracerID: -1,
  selectedRequestID: -1,
  httpResponsesFilter: false,
  inactiveTracersFilter: false,
  textFilter: false,
  tabID: "-1",
  tracyHost: "127.0.0.1",
  tracyPort: 7777,
  settingsPage: chrome.runtime.getURL("tracy/html/options.html"),
  apiKey: "12af65d4-4a3c-4cce-abe4-115d089e75f3"
};

// addOrEditTracer appends a new tracer if it doesn't already exist
// or modifies the tracer's properties if it does.
const addOrEditTracer = (state, action) => {
  const i = utils.firstIDByID(state.tracers, { ID: action.tracer.Tracer.ID });
  // If we aren't updating an existing element, just append it
  const t = action.tracer.Tracer;
  if (i < 0) {
    return state.tracers.concat([t]);
  }
  // Right now, we are only supporting updating the tracer's severity and
  // hastracerevents property
  const newt = Object.assign(state.tracers[i], {
    HasTracerEvents: t.HasTracerEvents,
    OverallSeverity: t.OverallSeverity
  });

  return state.tracers
    .filter(tr => tr.ID !== action.tracer.Tracer.ID)
    .concat([newt]);
};

const rootReducer = (state = init, action) => {
  switch (action.type) {
    case actions.CHANGE_SETTING:
      switch (action.setting) {
        case "rest-host":
          return Object.assign({}, state, { tracyHost: action.setting });
        case "rest-port":
          return Object.assign({}, state, { tracyPort: action.setting });
        case "api-key":
          return Object.assign({}, state, { apiKey: action.setting });
      }
      return state;
    case actions.SELECT_PROJ:
      // When a new project is selected, clear the app.
      return Object.assign({}, state, {
        proj: action.proj,
        tracers: [],
        events: [],
        tracersLoading: true
      });
    case actions.UPDATE_PROJECTS:
      return Object.assign({}, state, { projs: action.projs });
    case actions.DEL_PROJECT:
      return Object.assign({}, state, {
        projs: state.proj.splice(action.i, 1)
      });
    case actions.ADD_TRACER:
      return Object.assign({}, state, {
        tracers: addOrEditTracer(state, action)
      });
    case actions.ADD_REQUEST:
      const ids = action.req.Request.Tracers.map(t => t.ID);
      delete action.req.Request.Tracers;
      return Object.assign({}, state, {
        tracers: ids.reduce((accum, curr) => {
          const i = utils.firstIDByID(accum, { ID: curr });
          if (i < 0) return accum;
          let newt;
          if (accum[i].Requests) {
            newt = Object.assign(accum[i], {
              Requests: [...accum[i].Requests, action.req.Request]
            });
          } else {
            newt = Object.assign(accum[i], { Requests: [action.req.Request] });
          }
          return [...accum.filter(tr => tr.ID !== curr), newt];
        }, state.tracers)
      });
    case actions.UPDATE_TRACERS:
      return Object.assign({}, state, {
        tracersLoading: false,
        tracers: action.tracers,
        selectedTracerID: -1
      });
    case actions.SELECT_TRACER:
      return Object.assign({}, state, {
        eventsLoading: true,
        selectedTracerID: action.id,
        events: [],
        selectedEventID: -1
      });
    case actions.SELECT_EVENT:
      return Object.assign({}, state, {
        selectedEventID: action.id
      });
    case actions.UPDATE_EVENTS:
      return Object.assign({}, state, {
        eventsLoading: false,
        events: action.events
      });
    case actions.ADD_EVENT:
      // Only add an event if it belongs to the tracer currently selected.
      if (action.event.TracerEvent.TracerID !== state.selectedTracerID)
        return state;
      return Object.assign({}, state, {
        events: state.events
          .concat(utils.formatEvent(action.event.TracerEvent))
          .map(utils.enumerate)
      });
    case actions.TOGGLE_INACTIVE_FILTER:
      return Object.assign({}, state, {
        inactiveTracersFilter: !state.inactiveTracersFilter
      });
    case actions.TOGGLE_HTTP_RESPONSE_FILTER:
      return Object.assign({}, state, {
        httpResponsesFilter: !state.httpResponsesFilter
      });
    case actions.TOGGLE_TEXT_FILTER:
      return Object.assign({}, state, { textFilter: !state.textFilter });
    case actions.TOGGLE_WEBSOCKET_CONNECTED:
      return Object.assign({}, state, { webSocketOpen: true });
    case actions.TOGGLE_WEBSOCKET_DISCONNECTED:
      return Object.assign({}, state, { webSocketOpen: false });
    case actions.CHANGE_TAB:
      return Object.assign({}, state, { tabID: action.tabID });
    case actions.ADD_API_KEY:
      return Object.assign({}, state, { apiKey: action.apiKey });
    case actions.SELECT_REQUEST:
      return Object.assign({}, state, { selectedRequestID: action.id });
    default:
      return state;
  }
};

export default rootReducer;
