import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import App from "./ui/containers/App";
import { createStore } from "redux";
import rootReducer from "./ui/reducers";
import "@fortawesome/fontawesome-free-solid";
import "@fortawesome/fontawesome-free-brands";

export const store = createStore(rootReducer);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
