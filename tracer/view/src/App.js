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
    this.selectRow = {      
      mode: 'checkbox',
      clickToSelect: true,  // click to select, default is false
      clickToExpand: true  // click to expand row, default is false
    };
    this.expandTracerRow = this.expandTracerRow.bind(this);
    this.expandEventRow = this.expandEventRow.bind(this);
    this.formatRowSeverity = this.formatRowSeverity.bind(this);
    this.onAfterDeleteRow = this.onAfterDeleteRow.bind(this);
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

  formatRowSeverity(row, rowIdx) {
    return this.props.severity[row.Severity];
  }

  onAfterDeleteRow(rowKeys) {
    //TODO: add to archive so they can be seen again without refreshing
    //alert(rowKeys);
  }

  expandTracerRow(row) {
    const options = {
      expandRowBgColor: 'antiquewhite',
      afterDeleteRow: this.onAfterDeleteRow
    };

    // Pass the tracer string to the event context so they know how to highlight. 
    row.Contexts.map((context) =>
      context["TracerString"] = row.TracerString);
    return (
      <BootstrapTable 
        data={row.Contexts}
        hover={true}
        cellEdit={{  mode: 'click' }}
        options={options}
        expandableRow={ this.isExpandableRow }
        expandComponent={ this.expandEventRow }
        trClassName={ this.formatRowSeverity }
        selectRow={ this.selectRow }
        deleteRow={ true } 
        search>
        <TableHeaderColumn 
          dataField="ID" 
          width='5%' 
          isKey={true} 
          dataAlign="center"
          dataSort={true}
          filter={ { type: 'TextFilter', condition: 'eq' } }>
            ID
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Host"
          width='15%'
          dataSort={true}
          editable={{ readOnly: true }}
          filter={ { type: 'RegexFilter' } }>
            Host
        </TableHeaderColumn>
        <TableHeaderColumn
          dataField="Path" 
          width='15%' 
          dataSort={true}
          editable={{ readOnly: true }}
          filter={ { type: 'RegexFilter' } }>
            Path
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Params" 
          width='20%'  
          dataSort={true}
          editable={{ readOnly: true }}
          filter={ { type: 'RegexFilter' } }>
            Query Params
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="ContextLocationType" 
          width='10%' 
          dataSort={true}
          editable={{ readOnly: true }}
          filter={ { type: 'RegexFilter' } }>
            Location Type
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="NodeType" 
          width='10%' 
          dataSort={true}
          editable={{ readOnly: true }}
          filter={ { type: 'RegexFilter' } }>
            Node Type
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="EventType" 
          width='10%' 
          dataSort={true}
          editable={{ readOnly: true }}
          filter={ { type: 'RegexFilter' } }>
            Event Type
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Severity" 
          width='5%' 
          dataSort={true}
          editable={ { type: 'textarea' } }
          filter={ { type: 'RegexFilter' } }>
            Severity
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
        selectRow={ this.selectRow }
        deleteRow={ true }
        search>
        <TableHeaderColumn 
          dataField="ID" 
          width='5%' 
          isKey={true} 
          dataAlign="center" 
          dataSort={true}
          filter={ { type: 'RegexFilter',  } }>
            ID
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Method" 
          width='5%' 
          dataSort={true}
          filter={ { type: 'RegexFilter',  } }>
            Method
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Host" 
          width='10%' 
          dataSort={true}
          filter={ { type: 'RegexFilter',  } }>
            Host
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Path" 
          width='25%' 
          dataSort={true}
          filter={ { type: 'RegexFilter',  } }>
            Path
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Params" 
          width='20%' 
          dataSort={true}
          filter={ { type: 'RegexFilter',  } }>
            Query Parameters
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="TracerString" 
          width='20%' 
          dataSort={true}
          filter={ { type: 'RegexFilter',  } }>
            Tracer
        </TableHeaderColumn>
      </BootstrapTable>)
  }
}


export default App;
