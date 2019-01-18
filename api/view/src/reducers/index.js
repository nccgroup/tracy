import { combineReducers } from "redux";
import {
  SELECT_PROJ,
  UPDATE_PROJECTS,
  NEW_PROJECT,
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
} from "../actions";
import { firstIDByID } from "../utils";

const init = {
  proj: {},
  projs: [],
  tracers: [],
  events: [],
  tracersLoading: true,
  eventsLoading: false,
  selectedEventID: -1,
  selectedTracerID: -1,
  httpResponsesFilter: false,
  inactiveTracersFilter: false,
  textFilter: false
};

const rootReducer = (state = init, action) => {
  switch (action.type) {
    case SELECT_PROJ:
      // When a new project is selected, clear the app.
      return Object.assign({}, state, {
        proj: action.proj,
        tracers: [],
        events: [],
        tracersLoading: true
      });
    case UPDATE_PROJECTS:
      return Object.assign({}, state, { projs: action.projs });
    case DEL_PROJECT:
      return Object.assign({}, state, {
        projs: state.proj.splice(action.i, 1)
      });
    case ADD_TRACER:
      const i = firstIDByID(state.tracers, action.tracer);
      // If we aren't updating an existing element, just append it
      if (i < 0) {
        return Object.assign({}, state, {
          tracers: state.tracers.concat(action.tracer)
        });
      }
      state.tracers[i] = Object.assign(state.tracers[i], action.tracer);
      const j = firstIDByID(state.tracers, state.tracer);
      return Object.assign({}, state, {
        tracers: state.tracers
      });
    case ADD_REQUEST:
      const a = firstIDByID(state.tracers, action.req);
      // If we aren't updating an existing element, just append it
      if (a < 0) {
        return Object.assign({}, state, {
          tracers: state.tracers.concat(action.req)
        });
      }

      state.tracers[a] = Object.assign(state.tracers[a], action.req);
      const b = firstIDByID(state.tracers, state.tracer);
      return Object.assign({}, state, {
        tracers: state.tracers
      });
    case UPDATE_TRACERS:
      return Object.assign({}, state, {
        tracersLoading: false,
        tracers: action.tracers,
        selectedTracerID: -1
      });
    case SELECT_TRACER:
      return Object.assign({}, state, {
        eventsLoading: true,
        selectedTracerID: action.id,
        events: [],
        selectedEventID: -1
      });
    case SELECT_EVENT:
      return Object.assign({}, state, {
        selectedEventID: action.id
      });
    case UPDATE_EVENTS:
      return Object.assign({}, state, {
        eventsLoading: false,
        events: action.events
      });
    case ADD_EVENT:
      return Object.assign({}, state, {
        events: state.events.concat(action.event)
      });
    case TOGGLE_INACTIVE_FILTER:
      return Object.assign({}, state, {
        inactiveTracersFilter: !state.inactiveTracersFilter
      });
      break;
    case TOGGLE_HTTP_RESPONSE_FILTER:
      return Object.assign({}, state, {
        httpResponsesFilter: !state.httpResponsesFilter
      });
      break;
    case TOGGLE_TEXT_FILTER:
      return Object.assign({}, state, { textFilter: !state.textFilter });
      break;
    case TOGGLE_WEBSOCKET_CONNECTED:
      return Object.assign({}, state, { webSocketOpen: true });
      break;
    case TOGGLE_WEBSOCKET_DISCONNECTED:
      return Object.assign({}, state, { webSocketOpen: false });
      break;
    default:
      return state;
  }
};

export default rootReducer;
