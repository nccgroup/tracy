import { connect } from "react-redux";
import WebSocketRouter from "../components/WebSocketRouter";
import {
  addTracer,
  addRequest,
  addEvents,
  webSocketConnect,
  webSocketDisconnect
} from "../actions";

const mapStateToProps = state => ({
  isOpen: state.webSocketOpen,
  apiKey: state.apiKey,
  tracyHost: state.tracyHost,
  tracyPort: state.tracyPort
});

const mapDispatchToProps = dispatch => ({
  handleNewTracer: tracer => dispatch(addTracer(tracer)),
  handleNewRequest: req => dispatch(addRequest(req)),
  handleNewEvent: event => dispatch(addEvents(event)),
  webSocketConnected: () => dispatch(webSocketConnect()),
  webSocketDisconnected: () => dispatch(webSocketDisconnect())
});

export default connect(mapStateToProps, mapDispatchToProps)(WebSocketRouter);
