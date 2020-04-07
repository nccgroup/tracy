const EventTypes = {
  innerHTML: "innerHTML"
};

const MessageTypes = {
  Screenshot: {
    "message-type": "screenshot"
  },
  TracerStrings: {
    "message-type": "config",
    config: "tracer-string-types"
  },
  AddTracer: {
    "message-type": "database",
    query: "addTracer"
  },
  BulkJobs: {
    "message-type": "bulk-jobs"
  }
};

const Strings = {
  UNDEFINED: "undefined",
  INPUT: "input",
  SCREENSHOT: "screenshot",
  SCREENSHOT_DONE: "screenshot-done",
  TRACER_SWAP: "[[ID]]",
  ALPHA: "abcdefghijklmnopqrstuvwxyz"
};

const DefaultTracerTypes = [
  ["zzXSSzz", `\\"'<${Strings.TRACER_SWAP}>`],
  ["GEN-XSS", `\\"'<${Strings.TRACER_SWAP}>`],
  ["GEN-PLAIN", `${Strings.TRACER_SWAP}`],
  ["zzPLAINzz", `${Strings.TRACER_SWAP}`]
];

const ScriptContexts = {
  CONTENT: "CONTENT",
  PAGE: "PAGE",
  BACKGROUND: "BACKGROUND"
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
