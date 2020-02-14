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
    selectedTracerPayload: state.selectedTracerPayload,
    loading: state.selectedTracerPayload === "",
    selectedRequestID: state.selectedRequestID,
    lastSelectedTable: state.lastSelectedTable,
    selectedRequestTableIndex: state.selectedRequestTableIndex,
    refererFilter: state.refererFilter
  };
};

const mapDispatchToProps = dispatch => ({
  selectRequest: (index, id, clicked) =>
    dispatch(actions.selectRequest(index, id, clicked))
});
export default connect(mapStateToProps, mapDispatchToProps)(RequestTable);
