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
          enabled={this.props.textFilter}
          img="font"
          filter={actions.TOGGLE_TEXT_FILTER}
          description="filter innerText DOM writes"
        />
        <FilterButton
          name="inactive"
          imgType="glyph"
          enabled={this.props.inactiveTracersFilter}
          img="filter"
          filter={actions.TOGGLE_INACTIVE_FILTER}
          description="filter tracers without events"
        />
        <FilterButton
          name="referer"
          imgType="glyph"
          enabled={this.props.refererFilter}
          img="chevron-left"
          filter={actions.TOGGLE_REFERER_FILTER}
          description="filter requests that contain tracers in the referer header"
        />
      </ul>
    );
  }
}
