import React, { Component } from 'react';
import './App.css';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-table/dist/react-bootstrap-table.min.css'
import 'bootstrap/dist/css/bootstrap-theme.min.css';
import TracerEventDataExpanded from './TracerEventDataExpanded.js'

class App extends Component {
  constructor(props) {
    super(props);
    this.expandTracerRow = this.expandTracerRow.bind(this);
    this.expandEventRow = this.expandEventRow.bind(this);
    this.rowClassNameFormat = this.rowClassNameFormat.bind(this);
  }

  isExpandableRow(row) {
    return true;
  }

  expandEventRow(row) {
    var rawData;
    try {
      rawData = JSON.stringify(JSON.parse(row.RawData), null, 2);;
    } catch (e) {
      rawData = row.RawData;
    }
    return (
      <TracerEventDataExpanded
          data={rawData}
          tracerString={row.TracerString}/>
    );
  }

  rowClassNameFormat(row, rowIdx) {
    return this.props.severity[row.Severity];
  }

  expandTracerRow(row) {
    const options = {
      expandRowBgColor: 'antiquewhite'
    };

    // Pass the tracer string to the event context so they know how to highlight. 
    row.Contexts.map((context) =>
      context["TracerString"] = row.TracerString);
    return (
      <BootstrapTable 
        data={row.Contexts}
        hover={true}
        options={options}
        expandableRow={ this.isExpandableRow }
        expandComponent={ this.expandEventRow }
        trClassName={ this.rowClassNameFormat }
        search>
        <TableHeaderColumn 
          dataField="ID" 
          width='5%' 
          isKey={true} 
          dataAlign="center"
          dataSort={true}
          filter={ { type: 'TextFilter', delay: 250, condition: 'eq' } }>
            ID
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Host"
          width='15%'
          dataSort={true}
          filter={ { type: 'RegexFilter', delay: 250 } }>
            Host
        </TableHeaderColumn>
        <TableHeaderColumn
          dataField="Path" 
          width='20%' 
          dataSort={true}
          filter={ { type: 'RegexFilter', delay: 250 } }>
            Path
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Params" 
          width='20%'  
          dataSort={true}
          filter={ { type: 'RegexFilter', delay: 250 } }>
            Query Params
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="ContextLocationType" 
          width='10%' 
          dataSort={true}
          filter={ { type: 'RegexFilter', delay: 250 } }>
            Location Type
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="NodeType" 
          width='10%' 
          dataSort={true}
          filter={ { type: 'RegexFilter', delay: 250 } }>
            Node Type
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="EventType" 
          width='10%' 
          dataSort={true}
          filter={ { type: 'RegexFilter', delay: 250 } }>
            Event Type
        </TableHeaderColumn>
      </BootstrapTable>
    );
  }
  render() {
    return (
      <BootstrapTable 
        data={this.props.data} 
        striped
        hover={true}
        options={ this.props.options }
        expandableRow={ this.isExpandableRow }
        expandComponent={ this.expandTracerRow }
        search>
        <TableHeaderColumn 
          dataField="ID" 
          width='5%' 
          isKey={true} 
          dataAlign="center" 
          dataSort={true}
          filter={ { type: 'RegexFilter', delay: 250 } }>
            ID
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Method" 
          width='5%' 
          dataSort={true}
          filter={ { type: 'RegexFilter', delay: 250 } }>
            Method
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Host" 
          width='10%' 
          dataSort={true}
          filter={ { type: 'RegexFilter', delay: 250 } }>
            Host
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Path" 
          width='25%' 
          dataSort={true}
          filter={ { type: 'RegexFilter', delay: 250 } }>
            Path
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Params" 
          width='20%' 
          dataSort={true}
          filter={ { type: 'RegexFilter', delay: 250 } }>
            Query Parameters
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="TracerString" 
          width='20%' 
          dataSort={true}
          filter={ { type: 'RegexFilter', delay: 250 } }>
            Tracer
        </TableHeaderColumn>
      </BootstrapTable>)
  }
}


export default App;
