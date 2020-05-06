/*import prettier from "prettier/standalone";
import parserHTML from "prettier/parser-html";
import parserJSON from "prettier/parser-babel";*/
import { Strings, NodeTypeMappings } from "../shared/constants";
const textCommentNodeCheck = (cur, event) => {
  if (
    cur.data.toLowerCase().indexOf(event.TracerPayload.toLowerCase()) !== -1
  ) {
    // Leaf node of a script tag has a little bit higher severity.
    if (
      NodeTypeMappings[cur.nodeType] == "TEXT_NODE" &&
      cur.parentNode.nodeName.toLowerCase() === Strings.SCRIPT
    ) {
      return [
        {
          HTMLNodeType: cur.parentNode.nodeName,
          HTMLLocationType: NodeTypeMappings[cur.nodeType],
          Severity: 1,
          Reason: "LEAF NODE SCRIPT TAG",
        },
      ];
    }
    // Otherwise, it's just a regular leaf, with no severity.
    return [
      {
        HTMLNodeType: cur.parentNode.nodeName,
        HTMLLocationType: NodeTypeMappings[cur.nodeType],
        Severity: 0,
        Reason: "LEAF",
      },
    ];
  }
  return [];
};
const svgNodeCheck = (cur, event) => {
  // SVG nodes don't have an innerText method
  if (cur.nodeName.toLowerCase() === Strings.SVG || cur.viewportElement) {
    if (
      cur.innerHTML.toLowerCase().indexOf(event.TracerPayload.toLowerCase()) !==
      -1
    ) {
      let sev = 1;
      // Text writes indicate the DOM was written with an API such as .innerText.
      // These are likely not exploitable.
      if (event.EventType.toLowerCase() === Strings.TEXT) {
        sev = 0;
      }
      // Lead node of an SVG
      return [
        {
          HTMLNodeType: cur.parentNode.nodeName,
          HTMLLocationType: "TEXT",
          Severity: sev,
          Reason: "LEAF NODE SVG TAG",
        },
      ];
    }
  }
  return [];
};

const nodeNameCheck = (cur, event) => {
  // Checking the node names
  if (
    cur.nodeName.toLowerCase().indexOf(event.TracerPayload.toLowerCase()) !== -1
  ) {
    let sev = 3;
    // Text writes indicate the DOM was written with an API such as .innerText.
    // These are likely not exploitable.
    if (event.EventType.toLowerCase() === Strings.TEXT) {
      sev = 0;
    }
    return [
      {
        HTMLNodeType: cur.parentNode.nodeName,
        HTMLLocationType: "NODE NAME",
        Severity: sev,
        Reason: "NODE NAME",
      },
    ];
  }
  return [];
};

const attributesCheck = (cur, event) => {
  // Checking the attributes
  return cur.attributes
    .map((a) => {
      let agg = [];
      // the attribute name contains a tracer
      if (
        a.nodeName.toLowerCase().indexOf(event.TracerPayload.toLowerCase()) !==
        -1
      ) {
        let sev = 3;
        // Text writes indicate the DOM was written with an API such as .innerText.
        // These are likely not exploitable.
        if (event.EventType.toLowerCase() === Strings.TEXT) {
          sev = 0;
        }
        agg = [
          ...agg,
          {
            HTMLNodeType: cur.nodeName,
            HTMLLocationType: "ATTRIBUTE NAME",
            Severity: sev,
            Reason: "ATTRIBUTE NAME",
          },
        ];
      }

      // the attribute value contains a tracer
      const i = a.value
        .toLowerCase()
        .indexOf(event.TracerPayload.toLowerCase());
      if (i !== -1) {
        let sev = 1;
        let reason = "ATTRIBUTE VALUE";
        // We only want this event to fire when the user-controlled begins the value
        // of the href, otherwise we probably won't be able to get the javascript
        // protocol in there.
        if (a.nodeName === Strings.HREF && i === 0) {
          reason = "ATTRIBUTE VALUE STARTS WITH HREF";
          sev = 2;
        } else if (a.nodeName.startsWith(Strings.ON)) {
          reason = "ATTRIBUTE VALUE STARTS WITH ON";
          sev = 2;
        }

        // Text writes indicate the DOM was written with an API such as .innerText.
        // These are likely not exploitable.
        if (event.EventType.toLowerCase() === Strings.TEXT) {
          sev = 0;
        }

        agg = [
          ...agg,
          {
            HTMLNodeType: cur.nodeName,
            HTMLLocationType: "ATTRIBUTE VALUE",
            Severity: sev,
            Reason: reason,
          },
        ];
      }

      return agg;
    })
    .flat();
};

// findDOMContexts parses the raw event string from a DOM write uses their
// DOMParser API and TreeWalker API. Based on the placement of the tracer
// payload in the DOM, it assigns severities to all areas where a tracer
// payload is written to the DOM. Returns an arrays of events.
export const findDOMContexts = async (event, nodes) => {
  // First only do the non-text and non-comment nodes since those are special cases.
  const svgNodeNameAttrContexts = nodes
    .filter(
      (cur) =>
        NodeTypeMappings[cur.nodeType] !== "TEXT_NODE" &&
        NodeTypeMappings[cur.nodeType] !== "COMMENT_NODE"
    )
    .map((cur) => [
      ...svgNodeCheck(cur, event),
      ...nodeNameCheck(cur, event),
      ...attributesCheck(cur, event),
    ]);

  // Then, do the text and comment nodes. These don't have innerText attributes
  const textCommentNodeContexts = nodes
    .filter(
      (cur) =>
        NodeTypeMappings[cur.nodeType] === "TEXT_NODE" ||
        NodeTypeMappings[cur.nodeType] === "COMMENT_NODE"
    )
    .map((cur) => [...textCommentNodeCheck(cur, event)]);

  const contexts = [
    ...svgNodeNameAttrContexts,
    ...textCommentNodeContexts,
  ].filter((e) => e.length !== 0);

  // before submitting the event, prettify it and truncate it
  //const [prettyEvent, type] = prettify(rawEvent);

  //const prettyEvent = event;
  /*
  const [snippet, lineNum] = substringAround(
    prettyEvent,
    event.TracerPayload,
    1000,
    i
  );*/

  //const type = "text/html";
  return contexts.map((c) => {
    return {
      ...event,
      ...c.pop(),
      TracerPayload: event.TracerPayload,
      RawEvent: event.RawEvent,
      //RawEventType: type,
      //RawEventIndex: lineNum,
    };
  });
};
