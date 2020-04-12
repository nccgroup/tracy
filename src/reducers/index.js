/* global chrome */
import * as actions from "../actions";
import * as utils from "../utils";
import { store } from "../index";

const loadState = (settings) => {
  chrome.storage.local.get(settings, (r) => {
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
const tracerSwap = "[[ID]]";
const init = {
  appInitialized: false,
  projs: [],
  tracers: [],
  events: [],
  tracerPayloads: [
    ["zzXSSzz", `\\"'<${tracerSwap}>`],
    ["GEN-XSS", `\\"'<${tracerSwap}>`],
    ["GEN-PLAIN", `${tracerSwap}`],
    ["zzPLAINzz", `${tracerSwap}`],
  ],
  tracersLoading: true,
  eventsLoading: false,
  selectedEventID: -1,
  selectedEventTableIndex: -1,
  selectedTracerPayload: "",
  selectedTracerTableIndex: -1,
  selectedRequestID: -1,
  selectedRequestTableIndex: -1,
  httpResponsesFilter: false,
  inactiveTracersFilter: false,
  textFilter: false,
  refererFilter: false,
  apiKey: "12af65d4-4a3c-4cce-abe4-115d089e75f3",
  projName: "first project",
  tracyEnabled: true,
  onSettingsPage: false,
  lastSelectedTable: "tracer",
};

loadState(Object.keys(init));

// addOrEditTracer appends a new tracer if it doesn't already exist
// or modifies the tracer's properties if it does.
const addOrEditTracer = (state, action) => {
  const existing = state.tracers.filter(
    (t) => t.TracerPayload === action.tracer.TracerPayload
  );
  // If we aren't updating an existing element, just append it
  const t = action.tracer;
  if (existing && existing.length === 0) {
    return state.tracers.concat([t]);
  }

  // Right now, we are only supporting updating the tracer's severity and
  // hastracerevents, and the requests property
  const e = existing.pop();
  const newt = Object.assign({}, e, {
    HasTracerEvents: t.HasTracerEvents,
    Severity: t.Severity,
    Requests: t.Requests,
  });

  return state.tracers
    .filter((tr) => tr.TracerPayload !== action.tracer.TracerPayload)
    .concat([newt]);
};

const rootReducer = (state = init, action) => {
  let change = {};
  switch (action.type) {
    case actions.REFRESH:
      change = { tracersLoading: true, eventsLoading: true };
      break;
    case actions.TRACERS_LOADING:
      change = { tracersLoading: true };
      break;
    case actions.EVENTS_LOADING:
      change = { eventsLoading: true };
      break;
    case actions.UPDATE_SETTINGS:
      change = action.settings;
      break;
    case actions.APP_INITIALIZED:
      change = { ...state, appInitialized: action.init };
      break;
    case actions.CHANGE_SETTING:
      switch (Object.keys(action.setting).pop()) {
        case "proj":
          change = {
            projName: action.setting.proj.name,
            apiKey: action.setting.proj.apiKey,
            tracers: [],
            events: [],
            tracersLoading: true,
          };
          break;
        case "tracyEnabled":
          change = { tracyEnabled: action.setting.tracyEnabled };
          break;
        case "addedTracerPayload":
          change = {
            tracerPayloads: [
              ...state.tracerPayloads,
              action.setting.addedTracerPayload,
            ],
          };
          break;
        case "deletedTracerPayload":
          change = {
            tracerPayloads: state.tracerPayloads.filter(
              (tp) => tp[0] !== action.setting.deletedTracerPayload
            ),
          };
          break;
        default:
          break;
      }
      break;
    case actions.UPDATE_PROJECTS:
      change = { projs: action.projs };
      break;
    case actions.DEL_PROJECT:
      change = { projs: state.proj.splice(action.i, 1) };
      break;
    case actions.ADD_TRACER:
      change = {
        tracers: addOrEditTracer(state, action).sort(
          (a, b) => a.Created - b.Created
        ),
      };
      break;
    case actions.ADD_REQUEST:
      const ids = action.req.Request.Tracers.map((t) => t.ID);
      delete action.req.Request.Tracers;
      change = {
        tracers: ids.reduce((accum, curr) => {
          const i = utils.firstIDByID(accum, { ID: curr });
          if (i < 0) return accum;
          let newt;
          if (accum[i].Requests) {
            newt = Object.assign(accum[i], {
              Requests: [...accum[i].Requests, action.req.Request],
            });
          } else {
            newt = Object.assign(accum[i], { Requests: [action.req.Request] });
          }
          return [...accum.filter((tr) => tr.ID !== curr), newt];
        }, state.tracers),
      };
      break;
    case actions.UPDATE_TRACERS:
      change = {
        tracersLoading: false,
        tracers: action.tracers.sort((a, b) => a.Created - b.Created),
        selectedTracerPayload: action.payload,
      };
      break;
    case actions.SELECT_TRACER:
      change = {
        eventsLoading: true,
        selectedTracerPayload: action.tracerPayload,
        events: [],
        selectedEventID: 0,
        selectedTracerTableIndex: action.index,
      };
      if (action.clicked) {
        change.lastSelectedTable = "tracer";
      }
      break;
    case actions.SELECT_EVENT:
      change = {
        selectedEventID: action.id,
        selectedEventTableIndex: action.index,
      };

      if (action.clicked) {
        change.lastSelectedTable = "event";
      }
      break;
    case actions.UPDATE_EVENTS:
      change = {
        eventsLoading: false,
        events: action.events.map(utils.enumerate),
        selectedEventID: action.eventID,
        selectedEventTableIndex: action.tableID,
      };
      break;
    case actions.ADD_EVENTS:
      change = {
        events: [...state.events, ...action.events].map(utils.enumerate),
      };
      break;
    case actions.TOGGLE_INACTIVE_FILTER:
      change = { inactiveTracersFilter: !state.inactiveTracersFilter };
      break;
    case actions.TOGGLE_HTTP_RESPONSE_FILTER:
      change = { httpResponsesFilter: !state.httpResponsesFilter };
      break;
    case actions.TOGGLE_TEXT_FILTER:
      change = { textFilter: !state.textFilter };
      break;
    case actions.TOGGLE_REFERER_FILTER:
      change = { refererFilter: !state.refererFilter };
      break;
    case actions.CHANGE_TAB:
      change = { tabID: action.tabID };
      break;
    case actions.ADD_API_KEY:
      change = { apiKey: action.apiKey };
      break;
    case actions.SELECT_REQUEST:
      change = {
        selectedRequestID: action.id,
        selectedRequestTableIndex: action.index,
      };
      if (action.clicked) {
        change.lastSelectedTable = "request";
      }
      break;
    case actions.NAVIGATE_TO_SETTINGS_PAGE:
      change = { onSettingsPage: true };
      break;
    case actions.NAVIGATE_TO_UI_PAGE:
      change = { onSettingsPage: false };
      break;
    default:
      break;
  }

  chrome.storage.local.set(change);
  return Object.assign({}, state, change);
};

export default rootReducer;
