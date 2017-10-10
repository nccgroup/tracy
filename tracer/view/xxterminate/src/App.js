import React, { Component } from 'react';
import './App.css';
import TracerRows from './TracerRows.js'

class App extends Component {
  constructor(props) {
    super(props);
    this.sortBy = this.sortBy.bind(this);
    this.getTracers = this.getTracers.bind(this);
    this.setTracers = this.setTracers.bind(this);
    this.state = {tracers: [], sortDir: true};
  }

  componentDidMount() {
    this.getTracers();
  }

  getTracers() {
    /* Create the HTTP GET request to the /tracers API endpoint. */
    var req = new XMLHttpRequest();
    req.open("GET", "http://localhost:8081/tracers/events", true);
    req.onreadystatechange = this.setTracers;      

    /* Send it. */
    req.send();
  }

  setTracers(req) {
    if (req.target.readyState === 4 && req.target.status === 200 && req.target.responseText !== "") {
        /* For each of the tracers returned, add it to the DOM. */
        try {
          var data = JSON.parse(req.target.responseText);
          this.setState({
            tracers: data
          });
      } catch (e) {
        console.error(e)
      }
    }
  }

  sortBy(field) {
    function asc(a,b) {
      if (a[field] < b[field])
        return -1;
      if (a[field] > b[field])
        return 1;
      return 0;
    }

    function desc(a,b) {
      if (a[field] > b[field])
        return -1;
      if (a[field] < b[field])
        return 1;
      return 0;
    }

    var sortedTracers
    if (this.state.sortDir) {
       sortedTracers = this.state.tracers.sort(asc);
    } else {
      sortedTracers = this.state.tracers.sort(desc);
    }
    this.setState({
      tracers: sortedTracers,
      sortDir: !this.state.sortDir
    });
  }

  render() {
    return (
      <div className="App">
          <TracerRows sortBy={this.sortBy} tracers={this.state.tracers} />
      </div>
    );
  }
}


export default App;
