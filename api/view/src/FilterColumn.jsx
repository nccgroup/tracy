import React, { Component } from "react";
import FilterButton from "./FilterButton";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";

class FilterColumn extends Component {
  // Helper to see if an element is in localStorage.
  isInLocalStorage(key, ID) {
    var ret;
    try {
      ret = JSON.parse(localStorage.getItem(key)).indexOf(ID) > -1;
    } catch (e) {
      ret = false;
    }
    return ret;
  }

  // filterResponses filters out events that have the event type of response.
  filterResponses(context) {
    return context.EventType.toLowerCase() !== "http response";
  }

  // filterArchivedTracers filters out events and tracers that have been archived.
  filterArchivedTracers(tracer) {
    return !this.isInLocalStorage("archivedTracers", tracer.ID);
  }

  // filterArchives filters out events and tracers that have been archived.
  filterArchivedContexts(context) {
    return !this.isInLocalStorage("archivedContexts", context.ID);
  }

  // filterInactive filters out tracers that have no events or contexts.
  filterInactive(tracer) {
    return tracer.HasTracerEvents;
  }

  // filterTextNodes filters our events that are text nodes.
  filterTextNodes(context) {
    return context.EventType.toLowerCase() !== "text";
  }

  render() {
    return (
      <Row className="filter-buttons">
        <Col md={1}>
          <FilterButton
            name="text"
            imgType="glyph"
            img="text-size"
            handleChange={this.props.handleFilterChange}
            filter={this.filterTextNodes}
            description="filter innerText DOM writes"
          />
        </Col>
        <Col md={1}>
          <FilterButton
            name="responses"
            imgType="icon"
            img="reply"
            handleChange={this.props.handleFilterChange}
            filter={this.filterResponses}
            description="filter HTTP responses"
          />
        </Col>
        <Col md={1}>
          <FilterButton
            name="inactive"
            imgType="glyph"
            img="filter"
            handleChange={this.props.handleFilterChange}
            filter={this.filterInactive}
            description="filter tracers without events"
          />
        </Col>
      </Row>
    );
  }
}

export default FilterColumn;
