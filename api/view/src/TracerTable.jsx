import React, { PureComponent } from "react";
import "./App.css";
import ReactTable from "react-table";
import "react-table/react-table.css";

class TracerTable extends PureComponent {
	constructor(props) {
		super(props);

		this.onRowSelect = this.onRowSelect.bind(this);

		this.state = {
			selectedTracerID: -1
		};
	}

	onRowSelect(row) {
		this.props.handleTracerSelection(row);
		this.setState({
			selectedTracerID: row.ID
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
						switch (rowInfo.row.OverallSeverity) {
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

						if (rowInfo.row.ID === this.state.selectedTracerID) {
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
