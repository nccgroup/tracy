import React, { Component } from "react";

class WebSocketRouter extends Component {
	constructor(props) {
		super(props);

		this.state = {
			ws: null,
			isOpen: false
		};
		this.onReceive = this.onReceive.bind(this);
		this.onClose = this.onClose.bind(this);
		this.onError = this.onError.bind(this);
		this.onOpen = this.onOpen.bind(this);
	}

	componentDidMount() {
		let ws = new WebSocket("ws://localhost:8081/ws");
		ws.onmessage = this.onReceive;
		ws.onopen = this.onOpen;
		ws.onerror = this.onError;
		ws.onclose = this.onClose;

		this.setState({
			ws: ws
		});
	}

	shouldComponentUpdate(nextProps, nextState) {
		let ret = false;
		if (nextProps.tracer.ID !== this.props.tracer.ID) {
			ret = true;
		}
		return ret;
	}

	onOpen() {
		this.setState({
			isOpen: true
		});
	}

	onError(err) {}

	onClose() {
		this.setState({
			isOpen: false
		});
	}

	onReceive(event) {
		switch (Object.keys(JSON.parse(event.data))[0]) {
			case "Tracer":
				console.log("[NEWTRACER]", event);
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
	}

	render() {
		let status = "disconnected";
		if (
			this.state.ws &&
			this.state.ws.readyState !== this.state.ws.CLOSED &&
			this.state.isOpen
		) {
			status = "connected";
			var subscribe = [this.props.tracer.ID];
			this.state.ws.send(JSON.stringify(subscribe));
		}
		return <span>websocket status: {status}</span>;
	}
}

export default WebSocketRouter;
