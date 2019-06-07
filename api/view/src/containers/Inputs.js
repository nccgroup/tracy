import { connect } from "react-redux";
import Inputs from "../components/Inputs";
import * as utils from "../utils/index";
const mapStateToProps = state => {
  const t = utils.firstElemByID(state.tracers, state.selectedTracerID) || {};
  let r = {};
  if (t.Requests) {
    r = t.Requests.filter(r => r.ID === state.selectedRequestID)[0] || {};
  }
  return { tracer: t, request: r };
};

export default connect(mapStateToProps)(Inputs);
