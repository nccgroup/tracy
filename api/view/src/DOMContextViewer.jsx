import React, { Component } from "react";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-bootstrap-table/dist/react-bootstrap-table.min.css";
import "bootstrap/dist/css/bootstrap-theme.min.css";

class DOMContextViewer extends Component {
	constructor(props) {
		super(props);

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
		if (isSelected) {
			this.props.handleEventSelection(row.RawEvent);
		}
	}

	render() {
		const options = {
			defaultSortName: "Severity",
			defaultSortOrder: "desc"
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
				data={this.props.events}
				cellEdit={{ mode: "click" }}
				options={options}
				trClassName={this.formatRowSeverity}
				selectRow={selectRowProp}
				hover
				condensed
			>
				<TableHeaderColumn
					dataField="ID"
					isKey={true}
					width="50"
					dataAlign="center"
					dataSort={true}
					expandable={false}
				>
					ID
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="EventHost"
					dataSort={true}
					expandable={false}
					editable={{ readOnly: true }}
				>
					Host
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="EventPath"
					dataSort={true}
					expandable={false}
					editable={{ readOnly: true }}
				>
					Path
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="HTMLLocationType"
					dataSort={true}
					width="115"
					expandable={false}
					editable={{ readOnly: true }}
				>
					Location Type
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="HTMLNodeType"
					dataSort={true}
					width="75"
					expandable={false}
					editable={{ readOnly: true }}
				>
					Node Type
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="EventType"
					dataSort={true}
					width="75"
					expandable={false}
					editable={{ readOnly: true }}
				>
					Event Type
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="EventContext"
					dataSort={true}
					expandable={false}
					editable={{ readOnly: true }}
				>
					Event Context
				</TableHeaderColumn>
				<TableHeaderColumn
					dataField="Severity"
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
