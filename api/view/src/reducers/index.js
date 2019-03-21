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
  httpResponsesFilter: false,
  inactiveTracersFilter: false,
  textFilter: false,
  tabID: "-1",
  tracyHost: "127.0.0.1",
  tracyPort: 7777
};

const addTracer = (state, action) => {
  const i = utils.firstIDByID(
    state.tracers,
    utils.selectedTracerByID(state.tracers, state.selectedTracerID)
  );
  // If we aren't updating an existing element, just append it
  if (i < 0) {
    return state.tracers.concat(action.tracer);
  }
  state.tracers[i] = Object.assign(
    state.tracers[i],
    utils.selectedTracerByID(state.tracers, state.selectedTracerID)
  );
  return state.tracers;
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
      return Object.assign({}, state, {
        tracers: addTracer(state, action)
      });
    case actions.ADD_REQUEST:
      let r = state;
      const t = utils.formatRequest(action.req.Request);
      for (let i = 0; i < t.length; i++) {
        const a = utils.firstIDByID(r.tracers, t[i]);
        if (a < 0) {
          // If we aren't updating an existing element, just append it.
          r.tracers[a] = Object.assign(r.tracers[a], {
            tracers: addTracer(r, action)
          });
        } else {
          // We are probably just updating a tracer for a screenshot.
          if (t[i].Screenshot !== "") {
            // We are updating a tracer.
            r.tracers[a] = Object.assign(r.tracers[a], {
              screenshot: t[i].Screenshot
            });
          }
        }
      }
      return Object.assign({}, r);
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
    default:
      return state;
  }
};

export default rootReducer;
