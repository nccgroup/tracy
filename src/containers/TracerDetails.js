import { connect } from "react-redux";
import TracerDetails from "../components/TracerDetails";
import { selectEvent, startReproduction } from "../actions";

const mapStateToProps = state => ({
  data: state.event.RawEvent,
  highlightString: state.highlightString
});

export default connect(mapStateToProps)(TracerDetails);
