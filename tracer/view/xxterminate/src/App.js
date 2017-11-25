import React, { Component } from 'react';
import './App.css';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-table/dist/react-bootstrap-table.min.css'
import 'bootstrap/dist/css/bootstrap-theme.min.css';

class App extends Component {
  isExpandableRow(row) {
    return true;
  }

  expandComponent(row) {
    return (
      <BootstrapTable 
        data={row.Contexts} 
        striped={true} 
        hover={true}>
        <TableHeaderColumn dataField="ID" isKey={true} dataAlign="center" dataSort={true}>ID</TableHeaderColumn>
        <TableHeaderColumn dataField="ContextData" dataSort={true}>Context Data</TableHeaderColumn>
        <TableHeaderColumn dataField="ContextLocationType" dataSort={true}>Location Type</TableHeaderColumn>
        <TableHeaderColumn dataField="NodeType" dataSort={true}>Node Type</TableHeaderColumn>
        <TableHeaderColumn dataField="Host" dataSort={true}>Host</TableHeaderColumn>
        <TableHeaderColumn dataField="Path" dataSort={true}>Path</TableHeaderColumn>
        <TableHeaderColumn dataField="Params" dataSort={true}>Query Params</TableHeaderColumn>
        <TableHeaderColumn dataField="EventType" dataSort={true}>Event Type</TableHeaderColumn>
      </BootstrapTable>
    );
  }
  render() {
    return (
      <BootstrapTable 
        data={this.props.data} 
        striped={true} 
        hover={true}
        options={ this.props.options }
        expandableRow={ this.isExpandableRow }
        expandComponent={ this.expandComponent }>
        <TableHeaderColumn dataField="ID" isKey={true} dataAlign="center" dataSort={true}>ID</TableHeaderColumn>
        <TableHeaderColumn dataField="TracerString" dataSort={true}>Tracer</TableHeaderColumn>
        <TableHeaderColumn dataField="Method" dataSort={true}>HTTP Method</TableHeaderColumn>
        <TableHeaderColumn dataField="Host" dataSort={true}>Host</TableHeaderColumn>
        <TableHeaderColumn dataField="Path" dataSort={true}>Path</TableHeaderColumn>
        <TableHeaderColumn dataField="Params" dataSort={true}>Query Parameters</TableHeaderColumn>
      </BootstrapTable>)
  }
}


export default App;
