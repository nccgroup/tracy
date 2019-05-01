import { connect } from "react-redux";
import TracyEventsTable from "../components/TracerEventsTable";
import { selectEvent, updateEvents, startReproduction } from "../actions";

const mapStateToProps = state => ({
  loading: state.eventsLoading,
  events: state.events,
  selectedEventID: state.selectedEventID,
  selectedTracerID: state.selectedTracerID,
  filterResponses: state.httpResponsesFilter,
  filterTextNodes: state.textFilter
});

const mapDispatchToProps = dispatch => ({
  updateEvents: events => dispatch(updateEvents(events)),
  reproduce: () => dispatch(startReproduction()),
  selectEvent: id => dispatch(selectEvent(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(TracyEventsTable);
