import { connect } from "react-redux";
import DetailsViewer from "../components/DetailsViewer";
import { selectEvent, startReproduction } from "../actions";

const mapStateToProps = state => ({
  tracer: state.tracer,
  event: state.event
});

export default connect(mapStateToProps)(DetailsViewer);
