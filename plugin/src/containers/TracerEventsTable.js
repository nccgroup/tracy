import { connect } from "react-redux";
import TracyEventsTable from "../components/TracerEventsTable";
import * as actions from "../actions";

const mapStateToProps = state => ({
  loading: state.eventsLoading,
  events: state.events,
  selectedEventID: state.selectedEventID,
  selectedTracerPayload: state.selectedTracerPayload,
  filterResponses: state.httpResponsesFilter,
  filterTextNodes: state.textFilter
});

const mapDispatchToProps = dispatch => ({
  addEvent: event => dispatch(actions.addEvent(event)),
  updateEvents: events => dispatch(actions.updateEvents(events)),
  selectEvent: id => dispatch(actions.selectEvent(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(TracyEventsTable);
