import React, { Component } from "react";
import "./App.css";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-bootstrap-table/dist/react-bootstrap-table.min.css";
import "bootstrap/dist/css/bootstrap-theme.min.css";
import TracerEventDataExpanded from "./TracerEventDataExpanded";

class TracerTable extends Component {
	constructor(props) {
		super(props);

		this.onRowSelect = this.onRowSelect.bind(this);
		this.setTracers = this.setTracers.bind(this);
		this.getTracers = this.getTracers.bind(this);
		this.formatRequest = this.formatRequest.bind(this);
		this.formatRowSeverity = this.formatRowSeverity.bind(this);

		this.state = {
			tracers: []
		};
	}

	isExpandableRow(row) {
		return row.Contexts && row.Contexts.length > 0;
	}

	shouldComponentUpdate(nextProps, nextState) {
		var ret = true;
		//Only the filters changed.
		if (
			this.props.tracerFilters.length !== nextProps.tracerFilters.length
		) {
			this.getTracers();
			ret = false;
		}
		return ret;
	}

	expandEventRow(row) {
		var rawData;
		try {
			rawData = JSON.stringify(JSON.parse(row.RawData), null, 2);
		} catch (e) {
			rawData = row.RawData;
		}
		return (
			<TracerEventDataExpanded
				data={rawData}
				tracerString={row.TracerString}
			/>
		);
	}

	/* getTracers makes an XMLHTTPRequest to the tracers/events API to get the latest set of events. */
	getTracers() {
		/* Create the HTTP GET request to the /tracers API endpoint. */
		var req = new XMLHttpRequest();
		req.open("GET", "http://localhost:8081/tracers", true);
		req.onreadystatechange = this.setTracers;
		req.send();
	}

	parseVisibleTracers(requests, tracerFilters) {
		const parsedTracers = [].concat
			.apply([], requests.map(n => this.formatRequest(n)))
			.filter(n => n);

		// Apply filters from the filter column component.
		return tracerFilters.reduce(
			(accum, cur) => accum.filter(cur),
			parsedTracers
		);
	}

	/* setTracers catches the response from the XMLHTTPRequest of getTracers. */
	setTracers(req) {
		// For some reason, 304 Not Modified requests still hit this code.
		if (
			req.target.readyState === 4 &&
			req.target.status === 200 &&
			req.target.responseText !== ""
		) {
			try {
				// TODO: move to Server Sent events for this. no need to do all this polling. keep this for the initial data grab, then push updates
				const tracers = JSON.parse(req.target.responseText);
				const parsedTracers = this.parseVisibleTracers(
					tracers,
					this.props.tracerFilters
				);

				this.setState({
					tracers: parsedTracers
				});
			} catch (e) {
				// Probably an error with parsing the JSON.
				console.error(e);
			}
		}
	}

	componentDidMount() {
		this.getTracers();
		setInterval(this.getTracers, 3000);
	}

	/* Helper  to return the URL query parameters as a comma-separated list. */
	parseURLParameters(url) {
		var ret;
		var splitOnParam = url.split("?");
		if (splitOnParam.length > 1) {
			ret = splitOnParam[1].replace("&", ", ");
		} else {
			ret = "";
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

	/* Message the request objects into a set of tracer data structure so the table can read their columns. */
	formatRequest(request) {
		if (request.Tracers) {
			return request.Tracers.map(tracer => {
				return {
					ID: tracer.ID,
					RawRequest: request.RawRequest,
					RequestMethod: request.RequestMethod,
					RequestURL: this.parseHost(request.RequestURL),
					RequestPath: this.parsePath(request.RequestURL),
					TracerString: tracer.TracerString,
					TracerPayload: tracer.TracerPayload,
					TracerLocationIndex: tracer.TracerLocationIndex,
					TracerLocationType: tracer.TracerLocationType,
					OverallSeverity: tracer.OverallSeverity,
					TracerEventsLength: tracer.TracerEventsLength
				};
			});
		}
	}

	formatRowSeverity(row, rowIdx) {
		// Enum to human-readable structure to translate the different severity ratings.
		const severity = {
			0: "unexploitable",
			1: "suspicious",
			2: "probable",
			3: "exploitable"
		};
		return severity[row.OverallSeverity];
	}

	onRowSelect(row, isSelected, e) {
		if (isSelected) {
			this.props.handleTracerSelection(
				row.ID,
				row.RawRequest,
				row.TracerLocationIndex,
				row.TracerLocationType,
				row.TracerString.length
			);
		}
	}

	render() {
		const options = {
			defaultSortName: "ID",
			defaultSortOrder: "desc",
			afterDeleteRow: this.onAfterDeleteTracer
		};

		const selectRowProp = {
			mode: "radio",
			clickToSelect: true,
			onSelect: this.onRowSelect,
			bgColor: function(row, isSelect) {
				if (isSelect) {
					return "antiquewhite";
				}
			}
		};

		return (
			<BootstrapTable
				data={this.state.tracers}
				options={options}
				expandableRow={this.isExpandableRow}
				trClassName={this.formatRowSeverity}
				selectRow={selectRowProp}
				height="300px"
				scrollTop={"Bottom"}
				hover
				condensed
				search
			>
				<TableHeaderColumn
					dataField="ID"
					width="50"
					isKey={true}
					dataAlign="center"
					dataSort={true}
					expandable={false}
				>
					ID
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="RequestMethod"
					dataSort={true}
					width="75"
					expandable={false}
				>
					Method
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="RequestURL"
					dataSort={true}
					expandable={false}
				>
					Host
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="RequestPath"
					dataSort={true}
					expandable={false}
				>
					Path
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="TracerString"
					width="125"
					dataSort={true}
					expandable={false}
				>
					Tracer String
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="TracerPayload"
					width="125"
					dataSort={true}
					expandable={false}
				>
					Tracer Payload
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="OverallSeverity"
					dataSort={true}
					expandable={false}
					width="50"
				>
					Overall Severity
				</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

export default TracerTable;
