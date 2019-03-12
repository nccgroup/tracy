import { combineReducers } from "redux";
import * as actions from "../actions";
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
  textFilter: false,
  tabID: "-1"
};

const rootReducer = (state = init, action) => {
  switch (action.type) {
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
    case actions.ADD_REQUEST:
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
      return Object.assign({}, state, {
        events: state.events.concat(action.event)
      });
    case actions.TOGGLE_INACTIVE_FILTER:
      return Object.assign({}, state, {
        inactiveTracersFilter: !state.inactiveTracersFilter
      });
      break;
    case actions.TOGGLE_HTTP_RESPONSE_FILTER:
      return Object.assign({}, state, {
        httpResponsesFilter: !state.httpResponsesFilter
      });
      break;
    case actions.TOGGLE_TEXT_FILTER:
      return Object.assign({}, state, { textFilter: !state.textFilter });
      break;
    case actions.TOGGLE_WEBSOCKET_CONNECTED:
      return Object.assign({}, state, { webSocketOpen: true });
      break;
    case actions.TOGGLE_WEBSOCKET_DISCONNECTED:
      return Object.assign({}, state, { webSocketOpen: false });
      break;
    case actions.CHANGE_TAB:
      return Object.assign({}, state, { tabID: action.tabID });
    default:
      return state;
  }
};

export default rootReducer;
