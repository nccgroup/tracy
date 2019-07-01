/* global chrome */
import * as actions from "../actions";
import * as utils from "../utils";
import { store } from "../index";
/*const chrome = {
   runtime: {
   getURL: url => url
   },
   storage: {
   local: {
   set: v => console.log("setting storage", v)
   }
   }
   };*/
const loadState = settings => {
  chrome.storage.local.get(settings, r => {
    const e = chrome.runtime.lastError;
    if (e) {
      console.error(e);
      return;
    }
    if (r) {
      store.dispatch(actions.updateSettings(r));
      store.dispatch(actions.appInitialized(true));
    }
  });
};

// init is the default settings when the application is loaded.
const init = {
  appInitialized: false,
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
  tracyHost: "127.0.0.1",
  tracyPort: 7777,
  apiKey: "12af65d4-4a3c-4cce-abe4-115d089e75f3",
  projName: "first project",
  tracyEnabled: true,
  tracyLocal: true,
  onSettingsPage: false
};

loadState(Object.keys(init));

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
//
const rootReducer = (state = init, action) => {
  console.log("ACTION", action);
  let newState = state;
  switch (action.type) {
    case actions.UPDATE_SETTINGS:
      newState = Object.assign({}, state, action.settings);
      break;
    case actions.APP_INITIALIZED:
      newState = Object.assign({}, state, { appInitialized: action.init });
      break;
    case actions.CHANGE_SETTING:
      switch (Object.keys(action.setting).pop()) {
        case "tracyHost":
          newState = Object.assign({}, state, {
            tracyHost: action.setting.tracyHost
          });
          break;
        case "tracyPort":
          newState = Object.assign({}, state, {
            tracyPort: action.setting.tracyPort
          });
          break;
        case "proj":
          newState = Object.assign({}, state, {
            projName: action.setting.proj.name,
            apiKey: action.setting.proj.apiKey,
            tracers: [],
            events: [],
            tracersLoading: true
          });
          break;
        case "tracyEnabled":
          newState = Object.assign({}, state, {
            tracyEnabled: action.setting.tracyEnabled
          });
          break;
        case "tracyLocal":
          newState = Object.assign({}, state, {
            tracyLocal: action.setting.tracyLocal
          });
          break;
        default:
          newState = state;
          break;
      }
      break;
    case actions.UPDATE_PROJECTS:
      newState = Object.assign({}, state, { projs: action.projs });
      break;
    case actions.DEL_PROJECT:
      newState = Object.assign({}, state, {
        projs: state.proj.splice(action.i, 1)
      });
      break;
    case actions.ADD_TRACER:
      newState = Object.assign({}, state, {
        tracers: addOrEditTracer(state, action)
      });
      break;
    case actions.ADD_REQUEST:
      const ids = action.req.Request.Tracers.map(t => t.ID);
      delete action.req.Request.Tracers;
      newState = Object.assign({}, state, {
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
      break;
    case actions.UPDATE_TRACERS:
      newState = Object.assign({}, state, {
        tracersLoading: false,
        tracers: action.tracers,
        selectedTracerID: -1
      });
      break;
    case actions.SELECT_TRACER:
      newState = Object.assign({}, state, {
        eventsLoading: true,
        selectedTracerID: action.id,
        events: [],
        selectedEventID: -1
      });
      break;
    case actions.SELECT_EVENT:
      newState = Object.assign({}, state, {
        selectedEventID: action.id
      });
      break;
    case actions.UPDATE_EVENTS:
      newState = Object.assign({}, state, {
        eventsLoading: false,
        events: action.events
      });
      break;
    case actions.ADD_EVENT:
      // Only add an event if it belongs to the tracer currently selected.
      if (action.event.TracerEvent.TracerID !== state.selectedTracerID) {
        return state;
      }
      newState = Object.assign({}, state, {
        events: state.events
          .concat(utils.formatEvent(action.event.TracerEvent))
          .map(utils.enumerate)
      });
      break;
    case actions.TOGGLE_INACTIVE_FILTER:
      newState = Object.assign({}, state, {
        inactiveTracersFilter: !state.inactiveTracersFilter
      });
      break;
    case actions.TOGGLE_HTTP_RESPONSE_FILTER:
      newState = Object.assign({}, state, {
        httpResponsesFilter: !state.httpResponsesFilter
      });
      break;
    case actions.TOGGLE_TEXT_FILTER:
      newState = Object.assign({}, state, { textFilter: !state.textFilter });
      break;
    case actions.TOGGLE_WEBSOCKET_CONNECTED:
      newState = Object.assign({}, state, { webSocketOpen: true });
      break;
    case actions.TOGGLE_WEBSOCKET_DISCONNECTED:
      newState = Object.assign({}, state, { webSocketOpen: false });
      break;
    case actions.CHANGE_TAB:
      newState = Object.assign({}, state, { tabID: action.tabID });
      break;
    case actions.ADD_API_KEY:
      newState = Object.assign({}, state, { apiKey: action.apiKey });
      break;
    case actions.SELECT_REQUEST:
      newState = Object.assign({}, state, { selectedRequestID: action.id });
      break;
    case actions.NAVIGATE_TO_SETTINGS_PAGE:
      newState = Object.assign({}, state, { onSettingsPage: true });
      break;
    case actions.NAVIGATE_TO_UI_PAGE:
      newState = Object.assign({}, state, { onSettingsPage: false });
      break;
    default:
      newState = state;
      break;
  }
  chrome.storage.local.set(newState);
  return newState;
};

export default rootReducer;
