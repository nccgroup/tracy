import React, { Component } from "react";
import FilterButton from "../containers/FilterButton";
import * as actions from "../actions";

export default class FilterColumn extends Component {
  render() {
    return (
      <ul className="filter-column">
        <FilterButton
          name="text"
          imgType="glyph"
          img="font"
          filter={actions.TOGGLE_TEXT_FILTER}
          description="filter innerText DOM writes"
        />
        <FilterButton
          name="inactive"
          imgType="glyph"
          img="filter"
          filter={actions.TOGGLE_INACTIVE_FILTER}
          description="filter tracers without events"
        />
      </ul>
    );
  }
}
