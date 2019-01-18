import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import App from "./containers/App";
import { createStore } from "redux";
import rootReducer from "./reducers";
import "@fortawesome/fontawesome-free-solid";
import "@fortawesome/fontawesome-free-brands";

const store = createStore(rootReducer);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
