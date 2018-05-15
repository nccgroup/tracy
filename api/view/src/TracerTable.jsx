import React, { Component } from "react";
import "./App.css";
import ReactTable from "react-table";
import "react-table/react-table.css";

class TracerTable extends Component {
	constructor(props) {
		super(props);

		this.onRowSelect = this.onRowSelect.bind(this);

		this.state = {
			selectedTracer: {}
		};
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
				data={this.props.tracers}
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
