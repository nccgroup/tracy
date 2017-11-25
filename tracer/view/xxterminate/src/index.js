import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

   const options = {
      expandRowBgColor: 'rgb(242, 255, 163)'
    };

   function getTracers() {
    /* Create the HTTP GET request to the /tracers API endpoint. */
    var req = new XMLHttpRequest();
    req.open("GET", "http://localhost:8081/tracers/events", true);
    req.onreadystatechange = setTracers;      
    req.send();
  }

  function setTracers(req) {
    if (req.target.readyState === 4 && req.target.status === 200 && req.target.responseText !== "") {
        /* For each of the tracers returned, add it to the DOM. */
        try {
        	var data = JSON.parse(req.target.responseText);
        	var formattedData = data.map(formatData).filter(n => n.Contexts.length > 0);
			ReactDOM.render(<App data={formattedData} options={options}/>, document.getElementById('root'));
      } catch (e) {
        console.error(e)
      }
    }
  }

  function formatData(data) {
  	var ret = {};
  	if (data.Events.length !== 0) {
  		var formattedEvents = data.Events.map(formatEvent).reduce((accum, curr) =>
  			accum.concat(curr), []);
	  	ret = {
	  		ID: data.ID,
	  		Method: data.Method,
	  		TracerString: data.TracerString,
	  		Host: data.URL.split("?")[0].split("/")[0],
	  		Path: "/" + data.URL.split("?")[0].split("/")[1],
	  		Params: data.URL.split("?")[1].replace("&", ", "),
	  		Contexts: formattedEvents
	  	}
  	}

  	return ret;
  }

  function formatEvent(event) {
  	var ret = [];
  	if (event.ID) {
  		for(var i=0; i < event.Contexts.length; i++) {
  			var context = event.Contexts[i];
	  		var formattedContext = {
	  			ID: context.ID + event.ID,
	  			ContextLocationType: context.Location,
	  			NodeType: context.NodeName,
	  			ContextData: context.Context,
	  			EventType: event.EventType,
	  			Host: event.Location.split("://")[1].split("?")[0].split("/")[0],
	  			Path: "/" + event.Location.split("://")[1].split("?")[0].split("/")[1],
	  			Params: event.Location.split("?")[1].replace("&", ", ")
	  		};
	  		ret.push(formattedContext)
  		}
  	}
  	return ret;
  }

getTracers();
registerServiceWorker();
