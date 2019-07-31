import { connect } from "react-redux";
import Inputs from "../components/Inputs";

const mapStateToProps = state => {
  const curr = state.tracers.filter(
    t => t.TracerPayload === state.selectedTracerPayload
  );
  let t;
  if (curr.length > 0) {
    t = curr.pop();
  } else {
    t = {};
  }
  let r = {};
  if (t.Requests) {
    r = t.Requests.filter(r => r.ID === state.selectedRequestID)[0] || {};
  }
  return { tracer: t, request: r };
};

export default connect(mapStateToProps)(Inputs);
