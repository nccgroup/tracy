import React, { Component } from 'react';
import './App.css';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-bootstrap-table/dist/react-bootstrap-table.min.css'
import 'bootstrap/dist/css/bootstrap-theme.min.css';
import TracerEventDataExpanded from './TracerEventDataExpanded.js'

class MainTable extends Component {

  constructor(props) {
    super(props);
    this.selectRow = {      
      mode: 'checkbox',
      clickToSelect: true,  // click to select, default is false
      clickToExpand: true  // click to expand row, default is false
    };
    this.expandTracerRow = this.expandTracerRow.bind(this);
    this.expandEventRow = this.expandEventRow.bind(this);
    this.onAfterDeleteContext = this.onAfterDeleteContext.bind(this);
    this.setTracers = this.setTracers.bind(this);
    this.getTracers = this.getTracers.bind(this);
    this.formatEvent = this.formatEvent.bind(this);
    this.formatData = this.formatData.bind(this);
    this.formatRowSeverity = this.formatRowSeverity.bind(this);
    this.parseURLParameters = this.parseURLParameters.bind(this);
    this.parseHost = this.parseHost.bind(this);
    this.parsePath = this.parsePath.bind(this);
    this.assignEventsSeverityRating = this.assignEventsSeverityRating.bind(this);
    this.assignContextSeverityRating = this.assignContextSeverityRating.bind(this);
    this.isAttributeName = this.isAttributeName.bind(this);
    this.isNodeName = this.isNodeName.bind(this);
    this.isInAttributeValue = this.isInAttributeValue.bind(this);
    this.isInScriptTag = this.isInScriptTag.bind(this);
    this.onAfterDeleteTracer = this.onAfterDeleteTracer.bind(this);
    this.loadDataCache = this.loadDataCache.bind(this);
    this.state = {
      data: []
    };
  }

  isExpandableRow(row) {
    return true;
  }

  shouldComponentUpdate(nextProps, nextState) {
    var ret = true;
    //Only the filters changed. Just update based on the cache.
    if (this.props.tracerFilters.length !== nextProps.tracerFilters.length ||
      this.props.contextFilters.length !== nextProps.contextFilters.length) {
      this.loadDataCache(nextProps.tracerFilters, nextProps.contextFilters);
      ret = false;
    }
    return ret;
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

  // Try to load data from local storage while this is getting the new data. 
  loadDataCache(tracerFilters, contextFilters) {    
    const dataString = localStorage.getItem("data");
    try {
      if (dataString !== null && dataString.length > 0) {
        const data = this.parseVisibleData(JSON.parse(dataString), tracerFilters, contextFilters);
        this.setState({
          data: data
        });
      }
    } catch (e) {
      // Nothing needs to be done here.
    }
  }

  /* getTracers makes an XMLHTTPRequest to the tracers/events API to get the latest set of events. */
  getTracers() {
    /* Create the HTTP GET request to the /tracers API endpoint. */
    var req = new XMLHttpRequest();
    req.open("GET", "http://localhost:8081/tracers/events", true);
    req.onreadystatechange = this.setTracers;      
    req.send();
  }

  parseVisibleData(data, tracerFilters, contextFilters) {
    var parsedData = data.map(function(n){
      return this.formatData(n, contextFilters);
    }.bind(this)) // format the data to fit the table
    .map(this.assignEventsSeverityRating); // assign a severity rating to each of the tracers events

    // Apply filters from the filter column component.
    return tracerFilters.reduce( (accum, cur) => 
      accum.filter(cur), parsedData);
  }

  /* setTracers catches the response from the XMLHTTPRequest of getTracers. */
  setTracers(req) {
    if (req.target.readyState === 4 && req.target.status === 200 && req.target.responseText !== "") {
      try {
        const data = this.parseVisibleData(JSON.parse(req.target.responseText), this.props.tracerFilters, this.props.contextFilters);
        var cachedDataString = localStorage.getItem("data");
        if (cachedDataString !== null) {
          // If there was a cache and it looks different, update.
          if (req.target.responseText.length !== cachedDataString.length) {
            // Cache the data in the local storage so filters can be applied right away.
            localStorage.setItem("data", req.target.responseText);

            this.setState({
              data: data
            });
          }
        } else {
          // Cache the data in the local storage so filters can be applied right away.
          localStorage.setItem("data", req.target.responseText);

          this.setState({
            data: data
          });
        }
      } catch (e) {
        // Probably an error with parsing the JSON. 
        console.error(e);
      }
    }
  }

  componentDidMount() {
    this.loadDataCache(this.props.tracerFilters, this.props.contextFilters);
    this.getTracers();
    setInterval(this.getTracers, 10000);
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

  /* Format all the data events and parse the data into the corresponding columns. */
  formatData(data, contextFilters) {
    var ret = {};
    if (data.Events.length !== 0) {
      var formattedEvents = data.Events
        .map(this.formatEvent)
        .reduce((accum, curr) => accum.concat(curr), []);

      // Apply filters from the filter column component.
      formattedEvents = contextFilters.reduce( (accum, cur) => 
        accum.filter(cur), formattedEvents);

      ret = {
        ID: data.ID,
        Method: data.Method,
        TracerString: data.TracerString,
        Host: this.parseHost(data.URL),
        Path: this.parsePath(data.URL),
        Params: this.parseURLParameters(data.URL),
        Contexts: formattedEvents
      }
    }

    return ret;
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

    // These s should return a truthy value if the row is known to be exploitable. 
    const exploitableTests = [
      this.isAttributeName,
      this.isNodeName
    ];
    // These s should return a truthy value if the row is known to be probable. 
    const probableTests = [];
    // These s should return a truthy value if the row is known to be suspicious. 
    const suspiciousTests = [
      this.isInScriptTag,
      this.isInAttributeValue
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

  /* Test to see if the tracer was made the attribute name. */
  isAttributeName(context) {
    return context.ContextLocationType === this.props.locationTypes[0];
  }

  /* Test to see if the tracer was made the node name. */
  isNodeName(context) {
    return context.ContextLocationType === this.props.locationTypes[2];
  }

  /* Test to see if the tracer was found inside a script tag. */
  isInScriptTag(context) {
    return context.ContextLocationType === this.props.locationTypes[1] && context.NodeType === "script";
  }

  /* Test to see if the tracer was found inside an attribute value. */
  isInAttributeValue(context) {
    return context.ContextLocationType === this.props.locationTypes[3];
  }

  isInTextnode(context) {
    return context.ContextLocationType === this.props.locationTypes[1];
  }

  formatRowSeverity(row, rowIdx) {
    return this.props.severity[row.Severity];
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
      defaultSortOrder: 'desc' 
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
    const options = {
      expandRowBgColor: 'rgb(31, 145, 195)',
      defaultSortName: 'ID', 
      defaultSortOrder: 'desc',
      afterDeleteRow: this.onAfterDeleteTracer,  
    };
    return (
      <BootstrapTable 
        data={this.state.data}
        hover={true}
        options={ options }
        expandableRow={ this.isExpandableRow }
        trClassName={ this.formatRowSeverity }
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

export default MainTable;