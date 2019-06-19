import RequestTable from "../components/RequestTable";
import { connect } from "react-redux";
import * as actions from "../actions";
const mapStateToProps = state => {
  return {
    requests:
      state.selectedTracerID === -1
        ? []
        : state.tracers.filter(t => t.ID === state.selectedTracerID)[0]
            .Requests || [],
    loading: state.selectedTracerID === -1,
    selectedRequestID: state.selectedRequestID
  };
};

const mapDispatchToProps = dispatch => ({
  selectRequest: id => dispatch(actions.selectRequest(id))
});
export default connect(mapStateToProps, mapDispatchToProps)(RequestTable);
