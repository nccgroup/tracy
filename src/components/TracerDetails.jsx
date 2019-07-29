import React, { Component } from "react";
import HighlightedElement from "./HighlightedElement";
import Table from "react-bootstrap/lib/Table";

export default class TracerInputDetails extends Component {
  render() {
    return (
      <div>
        <img src={this.props.screenshot} />
        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th>AttributesX</th>
              <th>AttributesY</th>
            </tr>
          </thead>
          <tr>
            <th>Attributes1</th>
            <td>1</td>
            <td>2</td>
          </tr>
          <tr>
            <th>Attributes2</th>
            <td>1</td>
            <td>2</td>
          </tr>
        </Table>
      </div>
    );
  }
}
