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
		this.state = {
			loading: false,
			selectedEvent: {}
		};

		this.onRowSelect = this.onRowSelect.bind(this);
	}

	onRowSelect(row) {
		this.props.handleEventSelection(row);
		this.setState({
			selectedEvent: row
		});
	}

	isEmpty(obj) {
		return Object.keys(obj).length === 0 && obj.constructor === Object;
	}

	componentWillReceiveProps(nextProps) {
		if (
			(!this.isEmpty(nextProps.tracer) &&
				this.isEmpty(this.props.tracer)) ||
			(!this.isEmpty(nextProps.tracer) &&
				!this.isEmpty(this.props.tracer) &&
				nextProps.tracer.ID !== this.props.tracer.ID)
		) {
			// If the tracerID changed, trigger a request right away. Don't repeat here.
			this.setState({
				loading: true
			});
		} else {
			this.setState({
				loading: false
			});
		}
	}

	render() {
		let ret;
		if (this.state.loading) {
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
							switch (rowInfo.row._original.Severity) {
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

							if (
								rowInfo.row.ID === this.state.selectedEvent.ID
							) {
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

		return ret;
	}
}

export default TracerEventsTable;
