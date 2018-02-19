import React, { Component } from "react";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-bootstrap-table/dist/react-bootstrap-table.min.css";
import "bootstrap/dist/css/bootstrap-theme.min.css";

class DOMContextViewer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			events: []
		};

		this.requestEvents = this.requestEvents.bind(this);
		this.onRowSelect = this.onRowSelect.bind(this);
	}

	formatRowSeverity(row, rowIdx) {
		// Enum to human-readable structure to translate the different severity ratings.
		const severity = {
			0: "unexploitable",
			1: "suspicious",
			2: "probable",
			3: "exploitable"
		};

		return severity[row.Severity];
	}

	onRowSelect(row, isSelected, e) {
		this.props.handleEventSelection(
			row.RawEvent,
			row.EventContext,
			isSelected
		);
	}

	componentDidMount() {
		// When component mounts, begin polling for events.
		this.requestEvents(true);
	}

	componentWillReceiveProps(nextProps) {
		if (
			nextProps.tracerID !== -1 &&
			nextProps.tracerID !== this.props.tracerID
		) {
			// If the tracerID changed, trigger a request right away. Don't repeat here.
			this.requestEvents(false, nextProps.tracerID);
		}

		if (nextProps.tracerID === -1) {
			this.setState({
				events: []
			});
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

		return ret;
	}

	requestEvents(
		repeat,
		tracerID = this.props.tracerID,
		timingInterval = 1500
	) {
		// By default, the app starts with non of the tracers selected. Don't make a
		// request in this case.
		if (tracerID !== -1) {
			var req = new Request(
				`http://127.0.0.1:8081/tracers/${tracerID}/events`,
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

					const filteredEvents = this.props.contextFilters.reduce(
						(accum, cur) => accum.filter(cur),
						nEvents
					);

					// Need to check this race condition. There is a chance that when
					// this request returns, the tracer ID might have changed already.
					// If that is the case, we need to not render the results.
					if (this.props.tracerID === tracerID) {
						this.setState({
							events: filteredEvents
						});
					}
				});
		}
		// Set the next timeout if the repeat parameter is set
		if (repeat) {
			setTimeout(
				function() {
					// Continue to make requests
					this.requestEvents(true);
				}.bind(this),
				timingInterval
			);
		}
	}

	render() {
		const thStyle = {
			fontSize: "small",
			backgroundColor: "#282c34",
			color: "white",
			borderWidth: "0"
		};
		const tableStyle = {
			borderRadius: "0px",
			height: "3vh"
		};
		const bodyStyle = {
			height: "27vh"
		};
		const containerStyle = {
			height: "30vh"
		};

		const options = {
			defaultSortName: "Severity",
			defaultSortOrder: "desc"
		};

		const selectRow = {
			mode: "radio",
			clickToSelect: true,
			hideSelectColumn: true, // enable hide selection column.
			onSelect: this.onRowSelect,
			className: "row-selected"
		};

		return (
			<BootstrapTable
				data={this.state.events}
				options={options}
				trClassName={this.formatRowSeverity}
				selectRow={selectRow}
				containerStyle={containerStyle}
				tableStyle={tableStyle}
				bodyStyle={bodyStyle}
				scrollTop={"Bottom"}
				condensed
			>
				<TableHeaderColumn
					dataField="ID"
					isKey={true}
					width="50"
					dataAlign="center"
					thStyle={thStyle}
					dataSort={true}
					expandable={false}
				>
					ID
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="EventHost"
					thStyle={thStyle}
					dataSort={true}
					expandable={false}
					editable={{ readOnly: true }}
				>
					Host
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="EventPath"
					thStyle={thStyle}
					dataSort={true}
					expandable={false}
					editable={{ readOnly: true }}
				>
					Path
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="HTMLLocationType"
					thStyle={thStyle}
					dataSort={true}
					width="115"
					expandable={false}
					editable={{ readOnly: true }}
				>
					Location Type
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="HTMLNodeType"
					thStyle={thStyle}
					dataSort={true}
					width="75"
					expandable={false}
					editable={{ readOnly: true }}
				>
					Node Type
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="EventType"
					thStyle={thStyle}
					dataSort={true}
					width="75"
					expandable={false}
					editable={{ readOnly: true }}
				>
					Event Type
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="EventContext"
					thStyle={thStyle}
					dataSort={true}
					expandable={false}
					editable={{ readOnly: true }}
				>
					Event Context
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="Severity"
					thStyle={thStyle}
					dataSort={true}
					width="50"
					expandable={false}
					editable={{ type: "textarea" }}
				>
					Severity
				</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default DOMContextViewer;
