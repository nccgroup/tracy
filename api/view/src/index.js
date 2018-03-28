import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";
import "@fortawesome/fontawesome-free-solid";
import "@fortawesome/fontawesome-free-brands";
ReactDOM.render(<App />, document.getElementById("root"));

registerServiceWorker();
