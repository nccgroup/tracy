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

    ws.onmessage = function(event) {
      switch (Object.keys(JSON.parse(event.data))[0]) {
        case "Tracer":
          this.props.handleNewTracer(event);
          break;
        case "Request":
          this.props.handleNewRequest(event);
          break;
        case "TracerEvent":
          this.props.handleNewEvent(event);
          break;
        default:
          console.log("WebSocket message: ", event.data);
          break;
      }
    }.bind(this);

    ws.onopen = function() {
      this.setState({
        isOpen: true,
        ws: ws
      });
    }.bind(this);

    ws.onclose = function() {
      this.setState({
        isOpen: false,
        ws: null
      });

      setTimeout(this.connectToWebSocket, 1500);
    }.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    let ret = false;
    if (
      nextProps.tracer.ID !== this.props.tracer.ID ||
      nextState.isOpen !== this.state.isOpen
    ) {
      ret = true;
    }
    return ret;
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
      <div className="websocket">
        {status === "disconnected" ? spinner : ""}
        websocket status: <span className={`${status}`}>{status}</span>
      </div>
    );
  }
}

export default WebSocketRouter;
