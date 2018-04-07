import React, { Component } from "react";
import "./App.css";
import ReactTable from "react-table";
import "react-table/react-table.css";

class TracerTable extends Component {
	constructor(props) {
		super(props);

		this.onRowSelect = this.onRowSelect.bind(this);
		this.setTracers = this.setTracers.bind(this);
		this.getTracers = this.getTracers.bind(this);
		this.formatRequest = this.formatRequest.bind(this);
		this.formatRowSeverity = this.formatRowSeverity.bind(this);

		this.state = {
			tracers: [],
			selectedTracer: {}
		};
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

	/* getTracers makes an XMLHTTPRequest to the tracers/events API to get the latest set of events. */
	getTracers() {
		/* Create the HTTP GET request to the /tracers API endpoint. */
		var req = new XMLHttpRequest();
		req.open("GET", "http://localhost:8081/tracers", true);
		//req.setRequestHeader("X-Tracy", "NOTOUCHY");
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

				// There might be an update to the selected row's RawRequest element.
				for (var i = parsedTracers.length - 1; i >= 0; i--) {
					if (
						parsedTracers[i].TracerPayload ===
						this.state.selectedTracer.TracerPayload
					) {
						if (
							parsedTracers[i].RawRequest !==
							this.state.selectedTracer.RawRequest
						) {
							this.onRowSelect(parsedTracers[i]);
							break;
						}
					}
				}

				if (
					JSON.stringify(this.state.tracers) !==
					JSON.stringify(parsedTracers)
				) {
					this.setState({
						tracers: parsedTracers
					});
				}
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

	onRowSelect(row) {
		this.props.handleTracerSelection(row);
		this.setState({
			selectedTracer: row
		});
	}

	render() {
		let onRowSelect = this.onRowSelect;
		return (
			<ReactTable
				data={this.state.tracers}
				columns={[
					{
						Header: "injection points",
						columns: [
							{ Header: "id", accessor: "ID", width: 30 },
							{
								Header: "method",
								accessor: "RequestMethod",
								width: 40
							},
							{ Header: "host", accessor: "RequestURL" },
							{ Header: "path", accessor: "RequestPath" },
							{
								Header: "tracer string",
								accessor: "TracerString"
							},
							{
								Header: "tracer payload",
								accessor: "TracerPayload"
							},
							{
								Header: "severity",
								accessor: "OverallSeverity",
								width: 30
							}
						]
					}
				]}
				getTrProps={(state, rowInfo, column, instance) => {
					if (rowInfo) {
						let classname = "";
						switch (rowInfo.row._original.OverallSeverity) {
							case 1:
								classname = "suspicious";
								break;
							case 2:
								classname = "probable";
								break;
							case 3:
								classname = "exploitable";
								break;
							default:
								classname = "unexploitable";
						}

						if (rowInfo.row.ID === this.state.selectedTracer.ID) {
							classname += " row-selected";
						}

						return {
							onClick: (e, handleOriginal) => {
								onRowSelect(rowInfo.row);

								if (handleOriginal) {
									handleOriginal();
								}
							},
							className: classname
						};
					} else {
						return {};
					}
				}}
				defaultSorted={[
					{
						id: "id",
						desc: true
					}
				]}
				defaultPageSize={100}
			/>
		);
	}
}

export default TracerTable;
