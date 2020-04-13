const EventTypes = {
  InnerHTML: "innerHTML",
  FormAddedToDOM: "formAddedToDom",
  Submit: "submit",
  Message: "message",
  TracyMessage: "tracyMessage",
  TracyResponse: "tracyResponse",
};

const MessageTypes = {
  Screenshot: {
    id: "screenshot",
  },
  ScreenshotFinished: {
    id: "screenshot-finished",
  },
  GetTracerStrings: {
    id: "config",
    config: "tracer-string-types",
  },
  IsDisabled: {
    id: "config",
    config: "disabled",
  },
  GetTracers: {
    id: "database",
    query: "getTracers",
  },
  GetTracerEvents: {
    id: "database",
    query: "getTracerEventsByPayload",
  },
  AddTracer: {
    id: "database",
    query: "addTracer",
  },
  BulkJobs: {
    id: "bulk-jobs",
  },
  InnerHTML: {
    id: "job",
    type: "innerHTML",
  },
};

const Strings = {
  PROCESS_DOM_EVENTS: "processDOMEvents",
  SEARCH: "search",
  TEXT_HTML: "text/html",
  PNG: "png",
  SCRIPT: "script",
  TEXT_JAVASCRIPT: "text/javascript",
  DOM: "dom",
  INJECTED: "injected",
  TAG_MENU: "tag-menu",
  MOZ_EXT: "moz-extension",
  CHROME_EXT: "chrome-extension",
  INNER_HTML: "innerHTML",
  UNDEFINED: "undefined",
  INPUT: "input",
  SCRIPT: "script",
  STRING: "string",
  SVG: "svg",
  TEXT_AREA: "textarea",
  FORM: "form",
  CANVAS: "canvas",
  TWOD: "2d",
  HREF: "href",
  ON: "on",
  BODY: "body",
  TEXT: "text",
  URL: "url",
  DIV: "div",
  UL: "ul",
  LI: "li",
  HEADERS: "headers",
  SEARCH: "search",
  MOUSEDOWN: "mousedown",
  ATTRIBUTES: "attributes",
  CHARACTER_DATA: "characterData",
  SCREENSHOT: "screenshot",
  SCREENSHOT_DONE: "screenshot-done",
  TRACY_FORM_MOD: "tracy-form-mod",
  HIGHLIGHT_ON_HOVER: "highlight-on-hover",
  GEN: "gen",
  PX: "px",
  EVENT: "event",
  KEYBOARD: "keyboard",
  KEYPRESS: "keypress",
  KEYUP: "keyup",
  KEYDOWN: "keydown",
  CHANGE: "change",
  TYPE: "type",
  HIDDEN: "hidden",
  TRACER_SWAP: "[[ID]]",
  ALPHA: "abcdefghijklmnopqrstuvwxyz",
};

const DefaultTracerTypes = [
  ["zzXSSzz", `\\"'<${Strings.TRACER_SWAP}>`],
  ["GEN-XSS", `\\"'<${Strings.TRACER_SWAP}>`],
  ["GEN-PLAIN", `${Strings.TRACER_SWAP}`],
  ["zzPLAINzz", `${Strings.TRACER_SWAP}`],
];

const ScriptContexts = {
  CONTENT: "CONTENT",
  PAGE: "PAGE",
  BACKGROUND: "BACKGROUND",
};

const CurrentPageType = (() => {
  if (typeof chrome !== Strings.UNDEFINED) {
    if (typeof database !== Strings.UNDEFINED) {
      return ScriptContexts.BACKGROUND;
    }
    return ScriptContexts.CONTENT;
  }
  return ScriptContexts.PAGE;
})();

const SimulatedInputEvents = [
  { type: Strings.KEYBOARD, event: Strings.KEYPRESS },
  { type: Strings.KEYBOARD, event: Strings.KEYUP },
  { type: Strings.KEYBOARD, event: Strings.KEYDOWN },
  { type: Strings.EVENT, event: Strings.CHANGE },
];

const NodeTypeMappings = {
  1: "ELEMENT_NODE",
  2: "ATTRIBUTE_NODE",
  3: "TEXT_NODE",
  4: "CDATA_SECTION_NODE",
  5: "ENTITY_REFERENCE_NODE",
  6: "ENTITY_NODE",
  7: "PROCESSING_INSTRUCTION_NODE",
  8: "COMMENT_NODE",
  9: "DOCUMENT_NODE",
  10: "DOCUMENT_TYPE_NODE",
  11: "DOCUMENT_FRAGMENT_NODE",
  12: "NOTATION_NODE",
};
