import React, { Component } from "react";
import { sleep, newTracyNotification } from "../utils";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";

class WebSocketRouter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      apiKey: ""
    };
  }
  componentDidMount = () => {
    this.connectToWebSocket();
  };

  connectToWebSocket = () => {
    this.ws = new WebSocket(
      `ws://${this.props.tracyHost}:${this.props.tracyPort}/ws`
    );

    this.ws.onmessage = msg => {
      const data = JSON.parse(msg.data);
      console.log("[WEBSOCKET-IN]", data);
      switch (Object.keys(data)[0]) {
        case "Tracer":
          this.props.handleNewTracer(data);
          break;
        case "Request":
          this.props.handleNewRequest(data);
          break;
        case "TracerEvent":
          this.props.handleNewEvent(data);
          break;
        case "Notification":
          const n = data.Notification;
          n.Event.DOMContexts.map(c => {
            if (c.Severity >= 2) {
              newTracyNotification(n.Tracer, c, n.Event);
              return true;
            }
            return false;
          });

          break;
        default:
          break;
      }
    };

    this.ws.onopen = () => {
      this.props.webSocketConnected();
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.props.webSocketDisconnected();
      sleep(1500);
      this.connectToWebSocket();
    };
  };

  ws = null;
  spinner = <FontAwesomeIcon className="spinner" icon="spinner" />;
  check = <FontAwesomeIcon className="check" icon="check" />;

  render = () => {
    if (this.props.isOpen && this.ws !== null && this.state.apiKey) {
      // If we have a websocket connection, send a subscription notice
      // which channel we want to receive events for.
      console.log("[WEBSOCKET-OUT]", JSON.stringify([this.state.apiKey]));
      this.ws.send(JSON.stringify([this.state.apiKey]));
      return <div title="websocket connected">{this.check}</div>;
    }

    //    chrome.storage.get;
    return (
      <div title="websocketed disconnected. retrying...">{this.spinner}</div>
    );
  };
}

export default WebSocketRouter;
