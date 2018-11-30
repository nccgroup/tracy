import React, { Component } from "react";
import FilterButton from "../containers/FilterButton";
import Col from "react-bootstrap/lib/Col";
import Row from "react-bootstrap/lib/Row";
import { isInLocalStorage } from "../utils";
import {
  TOGGLE_TEXT_FILTER,
  TOGGLE_HTTP_RESPONSE_FILTER,
  TOGGLE_INACTIVE_FILTER
} from "../actions";

export default class FilterColumn extends Component {
  render() {
    return (
      <Row className="filter-buttons">
        <Col md={1}>
          <FilterButton
            name="text"
            imgType="glyph"
            img="text-size"
            filter={TOGGLE_TEXT_FILTER}
            description="filter innerText DOM writes"
          />
        </Col>
        <Col md={1}>
          <FilterButton
            name="responses"
            imgType="icon"
            img="reply"
            filter={TOGGLE_HTTP_RESPONSE_FILTER}
            description="filter HTTP responses"
          />
        </Col>
        <Col md={1}>
          <FilterButton
            name="inactive"
            imgType="glyph"
            img="filter"
            filter={TOGGLE_INACTIVE_FILTER}
            description="filter tracers without events"
          />
        </Col>
      </Row>
    );
  }
}
