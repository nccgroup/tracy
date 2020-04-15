import { connect } from "react-redux";
import PropertiesTable from "../components/PropertiesTable";
import { firstElemByID } from "../../shared/ui-helpers";

const reasonTable = {
  "0":
    "tracer payload found in the leaf node of an HTML element. unlikely to have broken the DOM",
  "1":
    "tracer payload found in the leaf node who's parent is a `<script>` tag. verify user-input cannot be used to execute arbitrary JavaScript in this page",
  "2":
    "tracer payload found in a tag name. this will only happen if user-input escaped a DOM property and created a new DOM node. very likely to be exploitable XSS",
  "3":
    "tracer payload found in the leaf node of a `<!-- -->` tag. verify user-input cannot be used to escape the comment block and write arbitrary HTML",
  "4":
    "tracer payload found in an attribute name. this will only happen if user-input escaped a DOM property and created a new DOM attribute. very likely to be exploitable XSS",
  "5":
    "tracer payload found in an attribute name of an HTTP response. verify this is rendered in the browser; if it is, it is likely to be exploitable XSS",
  "6":
    "tracer payload found at the beginning of an `href` attribute. verify user-input cannot be used to create a `javascript:` protocol to achieve XSS",
  "7":
    "tracer payload found inside an inline `on`-event handler. verify user-input caanot be used to execute JavaScript when this handler fires",
  "8":
    "tracer payload found insde an attribute value of an HTTP response. verify, when rendered in the browser, user-controlled input cannot be used to escape this attribute to achieve XSS",
};

const mapStateToProps = (state) => {
  const event = firstElemByID(state.events, state.selectedEventID);
  if (!event || event.ID < 0)
    return {
      eventURL: "",
      eventType: "",
      extras: "",
      eventContext: "",
      locationType: "",
      nodeType: "",
      sev: 0,
      reason: "",
    };
  return {
    eventURL: event.EventURL,
    eventType: event.EventType,
    extras: event.Extras,
    eventContext: event.EventContext,
    locationType: event.HTMLLocationType,
    nodeType: event.HTMLNodeType,
    sev: event.Severity,
    reason: reasonTable[event.Reason],
  };
};

export default connect(mapStateToProps)(PropertiesTable);
