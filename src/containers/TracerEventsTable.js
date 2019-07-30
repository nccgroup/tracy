import { connect } from "react-redux";
import TracyEventsTable from "../components/TracerEventsTable";
import * as actions from "../actions";

const mapStateToProps = state => ({
  loading: state.eventsLoading,
  events: state.events,
  selectedEventID: state.selectedEventID,
  selectedEventTableIndex: state.selectedEventTableIndex,
  lastSelectedTable: state.lastSelectedTable,
  selectedTracerPayload: state.selectedTracerPayload,
  filterResponses: state.httpResponsesFilter,
  filterTextNodes: state.textFilter
});

const mapDispatchToProps = dispatch => ({
  addEvents: events => dispatch(actions.addEvents(events)),
  updateEvents: events => dispatch(actions.updateEvents(events)),
  selectEvent: (index, id, clicked) =>
    dispatch(actions.selectEvent(index, id, clicked))
});

export default connect(mapStateToProps, mapDispatchToProps)(TracyEventsTable);
