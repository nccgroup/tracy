import React, { Component } from "react";
import FilterButton from "./FilterButton";
import {
  TOGGLE_TEXT_FILTER,
  TOGGLE_INACTIVE_FILTER,
  TOGGLE_REFERER_FILTER,
} from "../actions";
import { connect } from "react-redux";

const mapStateToProps = (state) => ({
  textFilter: state.textFilter,
  inactiveTracersFilter: state.inactiveTracersFilter,
  refererFilter: state.refererFilter,
});

class FilterColumn extends Component {
  render() {
    return (
      <ul className="filter-column">
        <FilterButton
          name="text"
          imgType="glyph"
          enabled={this.props.textFilter}
          img="font"
          filter={TOGGLE_TEXT_FILTER}
          description="filter innerText DOM writes"
        />
        <FilterButton
          name="inactive"
          imgType="glyph"
          enabled={this.props.inactiveTracersFilter}
          img="filter"
          filter={TOGGLE_INACTIVE_FILTER}
          description="filter tracers without events"
        />
        <FilterButton
          name="referer"
          imgType="glyph"
          enabled={this.props.refererFilter}
          img="chevron-left"
          filter={TOGGLE_REFERER_FILTER}
          description="filter requests that contain tracers in the referer header"
        />
      </ul>
    );
  }
}

export default connect(mapStateToProps)(FilterColumn);
