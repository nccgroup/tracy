import { connect } from "react-redux";
import EventDetails from "../components/EventDetails";
import { selectEvent, startReproduction } from "../actions";

const mapStateToProps = state => ({
  data: state.event.RawEvent,
  highlightString: state.highlightString,
  highlightOffset: state.highlightOffset,
  lang: state.lang
});

export default connect()(EventDetails);
