import React, { Component } from 'react';
import './App.css';
import TracerRows from './TracerRows.js'
import TracerNavigation from './TracerNavigation.js'

class App extends Component {
  constructor(props) {
    super(props);
    this.sortBy = this.sortBy.bind(this);
    this.getTracers = this.getTracers.bind(this);
    this.setTracers = this.setTracers.bind(this);
    this.addHighlight = this.addHighlight.bind(this);
    this.goToNextReference = this.goToNextReference.bind(this);
    this.goToPreviousReference = this.goToPreviousReference.bind(this);
    this.refsArray = [];
    this.refIndex = -1;
    this.state = {
      tracers: [], 
      sortDir: true
    };
  }

  componentDidMount() {
    this.getTracers();
    document.onkeydown = function(e) {
      e = e || window.event;
      switch(e.which || e.keyCode) {
        case 37: // left
        case 38: // up
          this.goToPreviousReference();
          break;
        case 39: // right
        case 40:
          this.goToNextReference();
          break;
        default:
          break;
      }
    }.bind(this);
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

  /* Push this function down to the code renderer, so we can quickly navigate to each
   *highlight.  */
  addHighlight(e) {
    if (e) {
        this.refsArray.push(e);
    }
  }

  scrollTo(ref) {
    var highlightedCode = ref.children[1];
    var oldClassName = highlightedCode.className;
    highlightedCode.className = oldClassName + " blinker";
    setTimeout(function(){
      highlightedCode.className = oldClassName;
    }, 2000);
    highlightedCode.scrollIntoView();
  }

  /* Go to the next tracer on the page. */
  goToNextReference() {
    if (this.refsArray[this.refIndex + 1]) {
      if (!this.refsArray[this.refIndex + 1].parentElement.parentElement.className.includes("hidden")){
        this.scrollTo(this.refsArray[this.refIndex + 1]);     
        this.refIndex++;
      } else {
        this.refIndex++;
        this.goToNextReference();
      }
      
    }
  }

  /* Go to the next tracer on the page. */
  goToPreviousReference() {
    if (this.refsArray[this.refIndex - 1]) {
      if (!this.refsArray[this.refIndex - 1].parentElement.parentElement.className.includes("hidden")) {
        this.scrollTo(this.refsArray[this.refIndex - 1]);  
        this.refIndex--;   
      } else {
        this.refIndex--;
        this.goToPreviousReference();
      }
    }    
  }

  render() {
    return (
      <div className="App">
          <TracerRows 
            addHighlight={this.addHighlight} 
            sortBy={this.sortBy} 
            tracers={this.state.tracers} />
          <TracerNavigation 
            goToNextReference={this.goToNextReference}
            goToPreviousReference={this.goToPreviousReference} />
      </div>
    );
  }
}


export default App;
