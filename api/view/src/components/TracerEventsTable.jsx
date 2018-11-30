import React, { Component } from "react";
import Col from "react-bootstrap/lib/Col";
import FormGroup from "react-bootstrap/lib/FormGroup";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { getTracerEvents } from "../utils";

export default class TracerEventsTable extends Component {
  reasonTable = {
    "0":
      "tracer payload found in the leaf node of an HTML element. unlikely to have broken the DOM",
    "1":
      "tracer payload found in the leaf node who's parent is a `<script>` tag. verify user-input cannot be used to execute arbitrary JavaScript in this page",
    "2":
      "tracer payload found in a tag name. this will only happen if user-input escaped a DOM property and created a new DOM node. very likely to be exploitable XSS",
    "3":
      "tracer payload found in the leaf node of a `<!-- -->` tag. verify user-input cannot be used to escape the comment block and write arbitrary HTML",
    "4":
      "tracer payload found in an attribute name. this will only happen if user-input escaped a DOM property and created a new DOM attribute. very likely to be exploitable XSS",
    "5":
      "tracer payload found in an attribute name of an HTTP response. verify this is rendered in the browser; if it is, it is likely to be exploitable XSS",
    "6":
      "tracer payload found at the beginning of an `href` attribute. verify user-input cannot be used to create a `javascript:` protocol to achieve XSS",
    "7":
      "tracer payload found inside an inline `on`-event handler. verify user-input caanot be used to execute JavaScript when this handler fires",
    "8":
      "tracer payload found insde an attribute value of an HTTP response. verify, when rendered in the browser, user-controlled input cannot be used to escape this attribute to achieve XSS"
  };

  render() {
    if (this.props.loading) {
      getTracerEvents(this.props.selectedTracerID).then(events =>
        this.props.updateEvents(events)
      );
      return (
        <FormGroup className="loading-spinner-parent">
          <Col md={12} className="loading-spinner-child text-center">
            <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate" />
          </Col>
        </FormGroup>
      );
    } else {
      return (
        <div>
          <div className="tracer-event-table-tool-tip" />
          <ReactTable
            data={this.props.events}
            columns={[
              {
                Header: "observed outputs",
                columns: [
                  { Header: "id", accessor: "ID", width: 45 },
                  { Header: "host", accessor: "EventHost" },
                  { Header: "path", accessor: "EventPath" },
                  {
                    Header: "location",
                    accessor: "HTMLLocationType"
                  },
                  {
                    Header: "node",
                    accessor: "HTMLNodeType"
                  },
                  {
                    Header: "output",
                    accessor: "EventType"
                  },
                  {
                    Header: "severity",
                    accessor: "Severity",
                    width: 75
                  } //,
                  //                  { Header: "reproduce", width: 5 }
                ]
              }
            ]}
            getTdProps={(state, rowInfo, column) => {
              return {
                onClick: (e, handleOriginal) => {
                  if (column.Header === "reproduce") {
                    this.reproduce();
                  }
                  if (handleOriginal) {
                    handleOriginal();
                  }
                }
              };
            }}
            getTrProps={(state, rowInfo, column, instance) => {
              if (rowInfo) {
                let classname = "";
                switch (rowInfo.row.Severity) {
                  case 1:
                    classname = "suspicious";
                    break;
                  case 2:
                    classname = "probable";
                    break;
                  case 3:
                    classname = "exploitable";
                    break;
                  default:
                    classname = "unexploitable";
                }

                if (rowInfo.row.ID === this.props.selectedEventID) {
                  classname += " row-selected";
                }

                return {
                  onClick: (e, handleOriginal) => {
                    this.props.selectEvent(rowInfo.row.ID);

                    if (handleOriginal) {
                      handleOriginal();
                    }
                  },
                  className: classname
                };
              } else {
                return {};
              }
            }}
            defaultSorted={[
              {
                id: "id",
                desc: true
              }
            ]}
            defaultPageSize={25}
          />
        </div>
      );
    }
  }
}
