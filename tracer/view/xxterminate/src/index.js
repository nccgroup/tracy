import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

const options = {
  expandRowBgColor: 'rgb(31, 145, 195)'
};

/* Enum to human-readable structure to translate the various DOM contexts. */
const locationTypes = {
  0: "attribute name",
  1: "text",
  2: "node name",
  3: "attribute value"
};

/* getTracers makes an XMLHTTPRequest to the tracers/events API to get the latest set of events. */
function getTracers() {
  /* Create the HTTP GET request to the /tracers API endpoint. */
  var req = new XMLHttpRequest();
  req.open("GET", "http://localhost:8081/tracers/events", true);
  req.onreadystatechange = setTracers;      
  req.send();
}

/* setTracers catches the response from the XMLHTTPRequest of getTracers. */
function setTracers(req) {
  if (req.target.readyState === 4 && req.target.status === 200 && req.target.responseText !== "") {
      try {
      	var data = JSON.parse(req.target.responseText)
          .map(formatData) // format the data to fit the table
          .filter(n => n.Contexts && n.Contexts[0] ); // filter out events that don't have any useful info in it.

        ReactDOM.render(<App locationTypes={locationTypes} data={data} options={options}/>, document.getElementById('root'));
    } catch (e) {
      // Probably an error with parsing the JSON. 
      console.error(e);
    }
  }
}

/* Helper function to return the URL query parameters as a comma-separated list. */
function parseURLParameters(url) {
    var ret;
    var splitOnParam = url.split("?");
    if (splitOnParam.length > 1) {
      ret = splitOnParam[1].replace("&", ", ");
    } else {
      ret = "";
    }

    return ret;
}

/* Helper function to return the hostname from a URL string. */
function parseHost(url) {
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

/* Helper function to return the path from a URL string. */
function parsePath(url) {
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
    ret = host.substring(pathIndex, host.length - 1);
  } else {
    ret = "/";
  }

  return ret;
}

/* Format all the data events and parse the data into the corresponding columns. */
function formatData(data) {
  var ret = {};
  if (data.Events.length !== 0) {
    var formattedEvents = data.Events
      .map(formatEvent)
      .reduce((accum, curr) =>
        accum.concat(curr), []);

    ret = {
      ID: data.ID,
      Method: data.Method,
      TracerString: data.TracerString,
      Host: parseHost(data.URL),
      Path: parsePath(data.URL),
      Params: parseURLParameters(data.URL),
      Contexts: formattedEvents
    }
  }

	return ret;
}

/* Format all the event contexts into their corresponding columns. */
function formatEvent(event) {
  var ret = [];
  if (event.ID) {
    ret = event.Contexts.map(function(context) {
      var ret = {}
      if (context.ID) {
        ret = {
          ID: context.ID,
          ContextLocationType: locationTypes[context.Location],
          NodeType: context.NodeName,
          ContextData: context.Context,
          RawData: event.Data,
          EventType: event.EventType,
          Host: parseHost(event.Location),
          Path: parsePath(event.Location),
          Params: parseURLParameters(event.Location)
        };

      }
      return ret;
    });
  }

  return ret;
}

getTracers();
registerServiceWorker();