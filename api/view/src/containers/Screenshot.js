import { connect } from "react-redux";
import Screenshot from "../components/Screenshot";
//import { selectedTracerByID } from "../utils";

/*const mapStateToProps = state => ({
  screenshot: selectedTracerByID(state.tracers, state.selectedTracerID)
    .Screenshot
});*/

export default connect(/*mapStateToProps*/)(Screenshot);
