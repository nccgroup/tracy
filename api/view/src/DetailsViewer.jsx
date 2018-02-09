import React, { Component } from "react";
import DOMContextViewer from "./DOMContextViewer";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";

/* View used to show the raw request and the events for the selected tracer row. */
class DetailsViewer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			events: [],
			interval: null,
			selectedEvent: ""
		};
		this.startGettingDOMContexts = this.startGettingDOMContexts.bind(this);
		this.handleEventSelection = this.handleEventSelection.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		if (
			nextProps.eventID !== -1 &&
			nextProps.eventID !== this.props.eventID
		) {
			// Clear the previous interval.
			if (this.state.interval) {
				clearInterval(this.state.interval);
			}

			// Start a new one based on the props based in.
			this.startGettingDOMContexts(
				this.props.eventID,
				nextProps.eventID,
				nextProps.timingInterval
			);
		}
	}

	/* Helper  to return the path from a URL string. */
	parsePath(url) {
		var ret = "";

		// In case the url has a protocol, remove it.
		var protocolSplit = url.split("://");
		var withoutProtocol;
		if (protocolSplit.length > 1) {
			withoutProtocol = protocolSplit[1];
		} else {
			withoutProtocol = protocolSplit[0];
		}

		var host = withoutProtocol.split("?")[0];
		var pathIndex = host.indexOf("/");
		if (pathIndex !== -1) {
			ret = host.substring(pathIndex, host.length);
		} else {
			ret = "/";
		}

		return ret;
	}

	/* Helper  to return the hostname from a URL string. */
	parseHost(url) {
		var ret;

		// In case the url has a protocol, remove it.
		var protocolSplit = url.split("://");
		var withoutProtocol;
		if (protocolSplit.length > 1) {
			withoutProtocol = protocolSplit[1];
		} else {
			withoutProtocol = protocolSplit[0];
		}

		var host = withoutProtocol.split("?")[0];
		var pathIndex = host.indexOf("/");

		if (pathIndex !== -1) {
			ret = host.substring(0, pathIndex);
		} else {
			ret = host;
		}

		return ret;
	}

	/* Format all the event contexts into their corresponding columns. */
	formatEvent(event) {
		// Enum to human-readable structure to translate the various DOM contexts.
		const locationTypes = {
			0: "attribute name",
			1: "text",
			2: "node name",
			3: "attribute value",
			4: "comment block"
		};

		var ret = [];
		if (event.DOMContexts && event.DOMContexts.length > 0) {
			ret = event.DOMContexts.map(
				function(context) {
					return {
						ID: event.ID + context.ID,
						HTMLLocationType:
							locationTypes[context.HTMLLocationType],
						HTMLNodeType: context.HTMLNodeType,
						EventContext: context.EventContext,
						RawEvent: event.RawEvent,
						EventType: event.EventType,
						EventHost: this.parseHost(event.EventURL),
						EventPath: this.parsePath(event.EventURL),
						Severity: context.Severity
					};
				}.bind(this)
			);
		}

		//TODO: do we want to even bother with these?
		/*else {
			return {
				ID: event.ID,
				HTMLLocationType: "",
				HTMLNodeType: "",
				EventContext: "",
				RawEvent: event.RawEvent,
				EventType: event.EventType,
				EventHost: this.parseHost(event.EventURL),
				EventPath: this.parsePath(event.EventURL),
				Severity: event.Severity
			};
		}*/

		return ret;
	}

	startGettingDOMContexts(pEventID, nEventID, timingInterval) {
		function requestEvents() {
			var req = new Request(
				`http://127.0.0.1:8081/tracers/${nEventID}/events`,
				{ method: "GET" }
			);

			fetch(req)
				.then(response => response.json())
				.catch(error => console.error("Error:", error))
				.then(response => {
					const nEvents = [].concat.apply(
						[],
						response.map(this.formatEvent.bind(this))
					);

					// If the events have changed, their length will have changed. Rerender the view
					if (
						pEventID !== nEventID ||
						nEvents.length !== this.state.events.length
					) {
						this.setState({
							events: nEvents
						});
					}
				});
		}

		const bound = requestEvents.bind(this);
		bound();
		const t = setInterval(bound, timingInterval);

		this.setState(function(prevState) {
			return {
				interval: t,
				eventID: nEventID,
				selectedEvent: ""
			};
		});
	}

	handleEventSelection(nSelectedEvent) {
		this.setState({
			selectedEvent: nSelectedEvent
		});
	}

	render() {
		return (
			<Row id="details-views">
				<Col md={4}>
					<pre className="raw-request">{this.props.rawRequest}</pre>
				</Col>
				<Col md={4}>
					<DOMContextViewer
						events={this.state.events}
						handleEventSelection={this.handleEventSelection}
					/>
				</Col>
				<Col md={4}>
					<pre className="raw-event">{this.state.selectedEvent}</pre>
				</Col>
			</Row>
		);
	}
}

export default DetailsViewer;
