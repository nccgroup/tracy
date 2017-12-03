import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

/* Enum to human-readable structure to translate the various DOM contexts. */
const locationTypes = {
  0: "attribute name",
  1: "text",
  2: "node name",
  3: "attribute value"
};

/* Enum to human-readable structure to translate the different severity ratings. */
const severity = {
  0: "unexploitable",
  1: "suspicious",
  2: "probable",
  3: "exploitable"
};

ReactDOM.render(<App severity={severity} locationTypes={locationTypes}/>, document.getElementById('root'));

registerServiceWorker();