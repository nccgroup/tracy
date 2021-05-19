/* global chrome */
import * as actions from "../actions";
import { firstIDByID } from "../../shared/ui-helpers";
import { store } from "../../ui";

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
    seenNotifications: false,
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
  tracersLoading: false,
  eventsLoading: false,
  rawEventLoading: false,
  tracersRefresh: false,
  eventsRefresh: false,
  selectedEventID: -1,
  selectedTracerID: -1,
  selectedTracerPayload: "",
  selectedRequestID: -1,
  httpResponsesFilter: false,
  inactiveTracersFilter: false,
  textFilter: false,
  refererFilter: false,
  apiKey: "12af65d4-4a3c-4cce-abe4-115d089e75f3",
  projName: "first project",
  onSettingsPage: false,
  lastSelectedTable: "tracer",
  selectedEventRawEvent: "",
  selectedEventRawEventType: "",
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
    case actions.SET_RAW_EVENT:
      change = {
        selectedEventRawEvent: action.rawEvent,
        selectedEventRawEventType: action.rawEventType,
        rawEventLoading: false,
      };
      break;
    case actions.RAW_EVENT_LOADING:
      change = { rawEventLoading: true };
      break;
    case actions.REFRESH:
      if (action.background) {
        change = { tracersRefresh: true, eventsRefresh: true };
      } else {
        change = { tracersLoading: true, eventsLoading: true };
      }
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
        tracers: addOrEditTracer(state, action),
      };
      break;
    case actions.ADD_REQUEST:
      const ids = action.req.Request.Tracers.map((t) => t.ID);
      delete action.req.Request.Tracers;
      change = {
        tracers: ids.reduce((accum, curr) => {
          const i = firstIDByID(accum, { ID: curr });
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
        tracersRefresh: false,
        tracers: action.tracers,
      };
      break;
    case actions.SELECT_TRACER:
      change = {
        eventsLoading: true,
        selectedTracerID: action.tracerID,
        selectedTracerPayload: state.tracers
          .filter((t) => t.ID === action.tracerID)
          .pop().TracerPayload,
        events: [],
        selectedEventID: -1,
        selectedEventRawEvent: "",
        selectedRequestID: -1,
      };
      if (action.clicked) {
        change.lastSelectedTable = "tracer";
      }
      break;
    case actions.SELECT_EVENT:
      change = {
        selectedEventID: action.eventID,
        rawEventLoading: true,
      };

      if (action.clicked) {
        change.lastSelectedTable = "event";
      }
      break;
    case actions.UPDATE_EVENTS:
      change = {
        eventsLoading: false,
        eventsRefresh: false,
        events: action.events,
      };
      break;
    case actions.ADD_EVENTS:
      change = {
        events: [...state.events, ...action.events],
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
        selectedRequestID: action.requestID,
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
  case actions.SEEN_NOTIFICATIONS:
      change = {seenNotifications: true}
      
      break
    default:
      break;
  }

  chrome.storage.local.set(change);
  return Object.assign({}, state, change);
};

export default rootReducer;
