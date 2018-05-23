import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/css/bootstrap-theme.min.css";
import Col from "react-bootstrap/lib/Col";
import FormGroup from "react-bootstrap/lib/FormGroup";
import ReactTable from "react-table";
import "react-table/react-table.css";

class TracerEventsTable extends Component {
	constructor(props) {
		super(props);
		this.onRowSelect = this.onRowSelect.bind(this);
	}

	onRowSelect(row) {
		this.props.handleEventSelection(row);
	}

	shouldComponentUpdate(nextProps, nextState) {
		let ret = false;
		if (
			nextProps.selectedEventID !== this.props.selectedEventID ||
			nextProps.events.length !== this.props.events.length ||
			nextProps.loading !== this.props.loading
		) {
			ret = true;
		}

		return ret;
	}

	render() {
		console.log("[RENDER]");
		let ret;
		if (this.props.loading) {
			ret = (
				<FormGroup className="loading-spinner-parent">
					<Col md={12} className="loading-spinner-child text-center">
						<span className="glyphicon glyphicon-refresh glyphicon-refresh-animate" />
					</Col>
				</FormGroup>
			);
		} else {
			let onRowSelect = this.onRowSelect;
			ret = (
				<ReactTable
					data={this.props.events}
					columns={[
						{
							Header: "observed outputs",
							columns: [
								{ Header: "id", accessor: "ID", width: 30 },
								{ Header: "host", accessor: "EventHost" },
								{ Header: "path", accessor: "EventPath" },
								{
									Header: "location type",
									accessor: "HTMLLocationType"
								},
								{
									Header: "node type",
									accessor: "HTMLNodeType"
								},
								{
									Header: "event type",
									accessor: "EventType"
								},
								{
									Header: "severity",
									accessor: "Severity",
									width: 30
								}
							]
						}
					]}
					getTrProps={(state, rowInfo, column, instance) => {
						if (rowInfo) {
							let classname = "";
							switch (rowInfo.row.Severity) {
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

							if (rowInfo.row.ID === this.props.selectedEventID) {
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
					defaultPageSize={25}
				/>
			);
		}

		return ret;
	}
}

export default TracerEventsTable;
