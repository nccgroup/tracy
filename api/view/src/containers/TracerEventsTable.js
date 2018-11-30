import { connect } from "react-redux";
import TracyEventsTable from "../components/TracerEventsTable";
import { selectEvent, updateEvents, startReproduction } from "../actions";
import { filterResponses, filterTextNodes, parseVisibleEvents } from "../utils";

const selectEvents = (events, httpResponses, textEvents) => {
  // Apply filters from the filter column component.
  let sfilters = [];
  if (httpResponses) sfilters.append(filterResponses);
  if (textEvents) sfilters.append(filterTextNodes);

  return parseVisibleEvents(events, sfilters);
};

const mapStateToProps = state => ({
  loading: state.eventsLoading,
  events: selectEvents(state.events, state.httpResponses, state.textEvents),
  selectedEventID: state.selectedEventID,
  selectedTracerID: state.selectedTracerID
});

const mapDispatchToProps = dispatch => ({
  updateEvents: events => dispatch(updateEvents(events)),
  reproduce: () => dispatch(startReproduction()),
  selectEvent: id => dispatch(selectEvent(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(TracyEventsTable);
