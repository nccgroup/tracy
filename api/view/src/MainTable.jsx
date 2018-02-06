import React, { Component } from 'react';
import './App.css';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-table/dist/react-bootstrap-table.min.css'
import 'bootstrap/dist/css/bootstrap-theme.min.css';
import TracerEventDataExpanded from './TracerEventDataExpanded'

class MainTable extends Component {

  constructor(props) {
    super(props);
    this.selectRow = {      
      mode: 'checkbox',
      clickToExpand: true  // click to expand row, default is false
    };
    this.expandTracerRow = this.expandTracerRow.bind(this);
    this.expandEventRow = this.expandEventRow.bind(this);
    this.onAfterDeleteContext = this.onAfterDeleteContext.bind(this);
    this.setTracers = this.setTracers.bind(this);
    this.getTracers = this.getTracers.bind(this);
    this.formatEvent = this.formatEvent.bind(this);
    this.formatRequest = this.formatRequest.bind(this);
    this.formatRowSeverity = this.formatRowSeverity.bind(this);
    this.parseURLParameters = this.parseURLParameters.bind(this);
    this.parseHost = this.parseHost.bind(this);
    this.parsePath = this.parsePath.bind(this);
    this.assignEventsSeverityRating = this.assignEventsSeverityRating.bind(this);
    this.assignContextSeverityRating = this.assignContextSeverityRating.bind(this);
    this.isAttributeName = this.isAttributeName.bind(this);
    this.isAttributeNameAndNotResponse = this.isAttributeNameAndNotResponse.bind(this);
    this.isNodeName = this.isNodeName.bind(this);
    this.isNodeNameAndNotResponse = this.isNodeNameAndNotResponse.bind(this);
    this.isInAttributeValue = this.isInAttributeValue.bind(this);
    this.isInAttributeValueAndNotResponse = this.isInAttributeValueAndNotResponse.bind(this);
    this.isInScriptTag = this.isInScriptTag.bind(this);
    this.isInScriptTagAndNotResponse = this.isInScriptTagAndNotResponse.bind(this);
    this.onAfterDeleteTracer = this.onAfterDeleteTracer.bind(this);
    this.state = {
      tracers: []
    };
  }

  isExpandableRow(row) {
    return row.Contexts && row.Contexts.length > 0
  }

  shouldComponentUpdate(nextProps, nextState) {
    var ret = true;
    //Only the filters changed.
    if (this.props.tracerFilters.length !== nextProps.tracerFilters.length ||
      this.props.contextFilters.length !== nextProps.contextFilters.length) {
      this.getTracers();
      ret = false;
    }
    return ret;
  }

  expandEventRow(row) {
    var rawData;
    try {
      rawData = JSON.stringify(JSON.parse(row.RawData), null, 2)
    } catch (e) {
      rawData = row.RawData
    }
    return (
      <TracerEventDataExpanded
          data={rawData}
          tracerString={row.TracerString}/>
    );
  }

  /* getTracers makes an XMLHTTPRequest to the tracers/events API to get the latest set of events. */
  getTracers() {
    /* Create the HTTP GET request to the /tracers API endpoint. */
    var req = new XMLHttpRequest()
    req.open("GET", "http://localhost:8081/tracers", true)
    req.onreadystatechange = this.setTracers
    req.send()
  }

  parseVisibleTracers(requests, tracerFilters) {
    const parsedTracers = [].concat.apply([], requests.map( (n) => this.formatRequest(n) )).filter( (n) => n)
    return parsedTracers
    // Apply filters from the filter column component.
    //return tracerFilters.reduce( (accum, cur) => accum.filter(cur), parsedTracers);
  }

  /* setTracers catches the response from the XMLHTTPRequest of getTracers. */
  setTracers(req) {
    // For some reason, 304 Not Modified requests still hit this code.
    if (req.target.readyState === 4 && req.target.status === 200 && req.target.responseText !== "") {
      try {
          // If the number of tracers changed, update.
          // TODO: move to Server Sent events for this. no need to do all this polling. keep this for the initial data grab, then push updates
          const tracers = JSON.parse(req.target.responseText)
          if (tracers.length !== this.state.tracers.length) {
            const parsedTracers = this.parseVisibleTracers(tracers, this.props.tracerFilters)
            console.log("parsedTracers: ", parsedTracers)
            this.setState({
              tracers: parsedTracers
            })
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
        return request.Tracers.map( (tracer) => {
          return {
            ID: tracer.ID,
            RawRequest: request.RawRequest,
            RequestMethod: request.RequestMethod,
            RequestURL: this.parseHost(request.RequestURL),
            RequestPath: this.parsePath(request.RequestURL),
            TracerString: tracer.TracerString,
            OverallSeverity: tracer.OverallSeverity,
          }})
      }
  }



  /* Format all the event contexts into their corresponding columns. */
  formatEvent(event) {
    var ret = [];
    if (event.ID) {
      ret = event.Contexts.map(function(context) {
        var ret = {}
        if (context.ID) {
          ret = {
            ID: context.ID,
            ContextLocationType: this.props.locationTypes[context.Location],
            NodeType: context.NodeName,
            ContextData: context.Context,
            RawData: event.Data,
            EventType: event.EventType,
            Host: this.parseHost(event.Location),
            Path: this.parsePath(event.Location),
            Params: this.parseURLParameters(event.Location)
          };

        }
        return ret;
      }.bind(this));
    }

    return ret;
  }

  /* Assigns a severity rating to each of the tracers events. */
  assignEventsSeverityRating(tracer) {
    tracer.Contexts = tracer.Contexts.map(this.assignContextSeverityRating);
    // Also give the tracer a severity rating of the max of all its events, so we you can
    // see if the tracer is vulnerable without clicking it.
    tracer["Severity"] = Math.max.apply(null, tracer.Contexts.map(n => n.Severity));
    return tracer;
  }

  /* Assign a severity rating to a row. New tests should be added to their corresponding category here. */
  assignContextSeverityRating(context) {
    var ret = context;

    // These should return a truthy value if the row is known to be exploitable. 
    const exploitableTests = [
      this.isAttributeNameAndNotResponse,
      this.isNodeNameAndNotResponse
    ];
    // These s should return a truthy value if the row is known to be probable. 
    const probableTests = [];
    // These s should return a truthy value if the row is known to be suspicious. 
    const suspiciousTests = [
      this.isInScriptTagAndNotResponse,
      this.isInAttributeValueAndNotResponse
    ];
    // These s should return a truthy value if the row is known to be unexploitable. 
    const unexploitableTests = [];

    const tests = [
      unexploitableTests,
      suspiciousTests,
      probableTests, 
      exploitableTests 
    ];

    // Execute each of the categories of tests. If any of the tests return true, set the 
    // severity to that rating. 
    var testResults = tests.map(function(testSuite, id, array) {
      if (testSuite
        .map((test) => test(ret))
        .some((n) => n))  {

        return id;
      } else {
        return 0;
      }
    });

    // Get the highest severity passed test and assign the context a severity.
    ret["Severity"] = Math.max.apply(null, testResults);

    return ret;
  }

  /* Test if the context is in a attribute value and part of a DOM event. */
  isInAttributeValueAndNotResponse(context) {
    return this.isInAttributeValue(context) 
      && context.EventType.toLowerCase() !== "response"
      && context.EventType.toLowerCase() !== "text"
  }

  /* Test if the context is in a script tag and part of a DOM event. */
  isInScriptTagAndNotResponse(context) {
    return this.isInScriptTag(context) 
      && context.EventType.toLowerCase() !== "response"
      && context.EventType.toLowerCase() !== "text"
  }

  /* Test if a payload is in an attribute and part of a DOM event. */
  isAttributeNameAndNotResponse(context) {
    return this.isAttributeName(context) 
      && context.EventType.toLowerCase() !== "response"
      && context.EventType.toLowerCase() !== "text"
  }

   /* Test if a payload is in a node name and part of a DOM event. */
  isNodeNameAndNotResponse(context) {
    return this.isNodeName(context) 
      && context.EventType.toLowerCase() !== "response"
      && context.EventType.toLowerCase() !== "text"
  }

  /* Test to see if the tracer was made the attribute name. */
  isAttributeName(context) {
    return context.ContextLocationType === this.props.locationTypes[0]
  }

  /* Test to see if the tracer was made the node name. */
  isNodeName(context) {
    return context.ContextLocationType === this.props.locationTypes[2]
  }

  /* Test to see if the tracer was found inside a script tag. */
  isInScriptTag(context) {
    return context.ContextLocationType === this.props.locationTypes[1] && context.NodeType === "script"
  }

  /* Test to see if the tracer was found inside an attribute value. */
  isInAttributeValue(context) {
    return context.ContextLocationType === this.props.locationTypes[3]
  }

  isInTextnode(context) {
    return context.ContextLocationType === this.props.locationTypes[1]
  }

  formatRowSeverity(row, rowIdx) {
    return this.props.severity[row.overall_severity]
  }

  onAfterDeleteContext(rowKeys) {
    var value = rowKeys
    if (!Array.isArray(rowKeys)) {
      value = [].concat(rowKeys)
    }
    const key = "archivedContexts";
    var old;
    try {
      old = JSON.parse(localStorage.getItem(key));
    } catch (e) {
      old = [];
    }

    if (old && Array.isArray(old)) {
      value = old.concat(value)
    }

    localStorage.setItem(key, JSON.stringify(value));
  }

  onAfterDeleteTracer(rowKeys) {
    var value = rowKeys
    if (!Array.isArray(rowKeys)) {
      value = [].concat(rowKeys)
    }
    const key = "archivedTracers";
    var old;
    try {
      old = JSON.parse(localStorage.getItem(key));
    } catch (e) {
      old = [];
    }

    if (old && Array.isArray(old)) {
      value = old.concat(value)
    }
    localStorage.setItem(key, JSON.stringify(value));
  }

  expandTracerRow(row) {
    const options = {
      expandRowBgColor: 'antiquewhite',
      afterDeleteRow: this.onAfterDeleteContext,
      defaultSortName: 'Severity', 
      defaultSortOrder: 'desc',
      expandBy: 'column'
    };

    // Pass the tracer string to the event context so they know how to highlight. 
    row.Contexts.map((context) =>
      context["TracerString"] = row.TracerString);
        /*expandableRow={ (n) => true }
        expandComponent={ this.expandEventRow }
        expandColumnOptions={ { expandColumnVisible: true } }*/
    return (
      <BootstrapTable 
        data={row.Contexts}
        cellEdit={{  mode: 'click' }}
        options={options}
        trClassName={ this.formatRowSeverity }
        selectRow={ this.selectRow }
        deleteRow={ true } 
        search>
        <TableHeaderColumn 
          dataField="ID"
          isKey={true} 
          width="4%"
          dataAlign="center"
          dataSort={true}
          expandable={false}
          filter={ { type: 'TextFilter', condition: 'eq' } }>
            ID
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Host"
          dataSort={true}
          expandable={false}
          editable={{ readOnly: true }}
          filter={ { type: 'RegexFilter' } }>
            Host
        </TableHeaderColumn>
        <TableHeaderColumn
          dataField="Path"
          dataSort={true}
          expandable= {false}
          editable={{ readOnly: true }}
          filter={ { type: 'RegexFilter' } }>
            Path
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Params"
          dataSort={true}
          expandable= {false}
          editable={{ readOnly: true }}
          filter={ { type: 'RegexFilter' } }>
            Query Params
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="ContextLocationType"
          dataSort={true}
          width="6%"
          expandable= {false}
          editable={{ readOnly: true }}
          filter={ { type: 'RegexFilter' } }>
            Location Type
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="NodeType"
          dataSort={true}
          width="5%"
          expandable= {false}
          editable={{ readOnly: true }}
          filter={ { type: 'RegexFilter' } }>
            Node Type
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="EventType"
          width="4%"
          dataSort={true}
          expandable= {false}
          editable={{ readOnly: true }}
          filter={ { type: 'RegexFilter' } }>
            Event Type
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="Severity"
          width="4%"
          dataSort={true}
          expandable={false}
          editable={ { type: 'textarea' } }
          filter={ { type: 'RegexFilter' } }>
            Severity
        </TableHeaderColumn>
      </BootstrapTable>
    );
  }
  render() {
    const options = {
      expandRowBgColor: "#f8f8f8",
      defaultSortName: 'ID', 
      defaultSortOrder: 'desc',
      afterDeleteRow: this.onAfterDeleteTracer,  
      expandBy: "column"
    };
        /*expandComponent={ this.expandTracerRow }
        expandColumnOptions={ { expandColumnVisible: true } }*/
    return (
      <BootstrapTable 
        data={this.state.tracers}
        options={ options }
        expandableRow={ this.isExpandableRow }
        trClassName={ this.formatRowSeverity }
        selectRow={ this.selectRow }
        containerStyle={ { height: "85vh", overflow: "visible" } }
        deleteRow={ true }>
        <TableHeaderColumn 
          dataField="ID"
          isKey={true} 
          dataAlign="center" 
          dataSort={true}
          expandable={false}
          filter={ { type: 'RegexFilter',  } }>
            ID
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="RequestMethod"
          dataSort={true}
          expandable={false}
          filter={ { type: 'RegexFilter',  } }>
            Method
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="RequestURL" 
          dataSort={true}
          expandable={false}
          filter={ { type: 'RegexFilter',  } }>
            Host
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="RequestPath" 
          dataSort={true}
          expandable={false}
          filter={ { type: 'RegexFilter',  } }>
            Path
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="TracerString" 
          dataSort={true}
          expandable={false}
          filter={ { type: 'RegexFilter',  } }>
            Tracer String
        </TableHeaderColumn>
        <TableHeaderColumn 
          dataField="OverallSeverity" 
          dataSort={true}
          expandable={false}
          filter={ { type: 'RegexFilter',  } }>
            Severity
        </TableHeaderColumn>
      </BootstrapTable>)
  }
}

export default MainTable;