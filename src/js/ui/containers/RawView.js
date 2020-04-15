import { connect } from "react-redux";
import RawView from "../components/RawView";

const mapStateToProps = state => ({
  tracer:
    state.tracers
      .filter(t => t.TracerPayload === state.selectedTracerPayload)
      .pop() || {},
  event: state.events.filter(e => e.ID === state.selectedEventID).pop() || {}
});

export default connect(mapStateToProps)(RawView);
