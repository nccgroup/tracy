import React, { Component } from "react";
import { sleep, newTracyNotification } from "../utils";

class WebSocketRouter extends Component {
  componentDidMount() {
    this.connectToWebSocket();
  }

  connectToWebSocket() {
    while (true) {
      if (!window.tracy) {
        sleep(1500);
        continue;
      }

      break;
    }

    this.ws = new WebSocket(
      `ws://${window.tracy.host}:${window.tracy.port}/ws`
    );

    this.ws.onmessage = msg => {
      const data = JSON.parse(msg.data);
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
  }

  ws = null;

  spinner = (
    <span className="connecting glyphicon glyphicon-refresh glyphicon-refresh-animate">
      {" "}
    </span>
  );

  render() {
    let status = "disconnected";
    if (this.props.isOpen && this.ws !== null) {
      // If we have a websocket connection, send a subscription notice
      // which channel we want to receive events for.
      status = "connected";
      this.ws.send(JSON.stringify([this.props.tracerID]));
    }

    return (
      <div>
        {status === "disconnected" ? this.spinner : ""}
        websocket: <span className={`${status}`}>{status}</span>
      </div>
    );
  }
}

export default WebSocketRouter;
