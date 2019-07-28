import RequestTable from "../components/RequestTable";
import { connect } from "react-redux";
import * as actions from "../actions";
const mapStateToProps = state => {
  return {
    requests: (() => {
      if (state.selectedTracerPayload === "") {
        return [];
      } else {
        const reqs = state.tracers
          .filter(t => t.TracerPayload === state.selectedTracerPayload)
          .pop();
        if (reqs) {
          return reqs.Requests;
        }
        return [];
      }
    })(),
    loading: state.selectedTracerPayload === "",
    selectedRequestID: state.selectedRequestID
  };
};

const mapDispatchToProps = dispatch => ({
  selectRequest: id => dispatch(actions.selectRequest(id))
});
export default connect(mapStateToProps, mapDispatchToProps)(RequestTable);
