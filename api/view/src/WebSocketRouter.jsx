import React, { Component } from "react";

class WebSocketRouter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ws: null,
      isOpen: false
    };

    this.connectToWebSocket = this.connectToWebSocket.bind(this);
  }

  componentDidMount() {
    this.connectToWebSocket();
  }

  connectToWebSocket() {
    if (!window.tracy) {
      setTimeout(this.connectToWebSocket, 1500);
      return;
    }

    let ws = new WebSocket(`ws://${window.tracy.host}:${window.tracy.port}/ws`);

    ws.onmessage = msg => {
      switch (Object.keys(JSON.parse(msg.data))[0]) {
        case "Tracer":
          this.props.handleNewTracer(msg);
          break;
        case "Request":
          this.props.handleNewRequest(msg);
          break;
        case "TracerEvent":
          this.props.handleNewEvent(msg);
          break;
        case "Notification":
          const n = JSON.parse(msg.data).Notification;
          n.Event.DOMContexts.map(c => {
            if (c.Severity >= 2) {
              this.props.handleNotification(n.Tracer, c, n.Event);
              return true;
            }
            return false;
          });

          break;
        default:
          break;
      }
    };

    ws.onopen = () => {
      this.setState({
        isOpen: true,
        ws: ws
      });
    };

    ws.onclose = () => {
      this.setState({
        isOpen: false,
        ws: null
      });
      setTimeout(this.connectToWebSocket, 1500);
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      nextProps.tracer.ID !== this.props.tracer.ID ||
      nextState.isOpen !== this.state.isOpen
    ) {
      return true;
    }
    return false;
  }

  render() {
    let status = "disconnected";
    if (
      this.state.ws &&
      this.state.ws.readyState !== this.state.ws.CLOSED &&
      this.state.isOpen
    ) {
      // If we have a websocket connection, send a subscription notice
      // which channel we want to receive events for.
      status = "connected";
      const subscribe = [this.props.tracer.ID];
      this.state.ws.send(JSON.stringify(subscribe));
    }

    const spinner = (
      <span className="connecting glyphicon glyphicon-refresh glyphicon-refresh-animate">
        {" "}
      </span>
    );
    return (
      <div className="websocket-container">
        {status === "disconnected" ? spinner : ""}
        websocket: <span className={`${status}`}>{status}</span>
      </div>
    );
  }
}

export default WebSocketRouter;
