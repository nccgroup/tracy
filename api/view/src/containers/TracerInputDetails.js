import { connect } from "react-redux";
import TracerInputDetails from "../components/TracerInputDetails";
import { selectedTracerByID } from "../utils";

/*const mapStateToProps = state => {
  const tracer = selectedTracerByID(state.tracers, state.selectedTracerID);
  console.log("TRACER:", tracer);
  return {
    rawData: tracer.RawRequest,
    highlightString: tracer.Payload
  };
};*/

export default connect(/*mapStateToProps*/)(TracerInputDetails);
