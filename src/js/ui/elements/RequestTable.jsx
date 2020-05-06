import React, { useEffect } from "react";
import ArrowNavigationTable from "./ArrowNavigationTable";
import { filterReferers } from "../../shared/ui-helpers";
import { connect } from "react-redux";
import { selectRequest } from "../actions";

const columns = [
  {
    Header: "http injection requests",
    columns: [
      { Header: "id", accessor: "ID", width: 45 },
      { Header: "method", accessor: "RequestMethod", width: 45 },
      { Header: "url", accessor: "RequestURL" },
    ],
  },
];
const defaultSort = [
  {
    id: "ID",
    desc: true,
  },
];

const mapDispatchToProps = (dispatch) => ({
  selectRow: (id, clicked) => dispatch(selectRequest(id, clicked)),
});

const mapStateToProps = (state) => {
  return {
    requests: (() => {
      if (state.selectedTracerPayload === "") {
        return [];
      } else {
        const reqs = state.tracers
          .filter((t) => t.TracerPayload === state.selectedTracerPayload)
          .pop();
        if (reqs) {
          return reqs.Requests;
        }
        return [];
      }
    })(),
    selectedTracerPayload: state.selectedTracerPayload,
    loading: state.tracersLoading,
    selectedID: state.selectedRequestID,
    lastSelectedTable: state.lastSelectedTable,
    refererFilter: state.refererFilter,
  };
};

let reset;
const setReset = (r) => (reset = r);
const RequestTable = (props) => {
  useEffect(() => {
    if (props.requests.length > 0 && props.selectedRequestID === -1) {
      props.selectRow(props.requests[props.requests.length - 1].ID, false);
    }
  }, [props.selectedTracerPayload, props.requests]);
  useEffect(() => {
    if (reset) {
      reset();
    }
  }, [props.selectedTracerPayload]);

  let requests = props.requests;
  if (props.refererFilter) {
    requests = requests.filter(filterReferers(props.selectedTracerPayload));
  }
  return (
    <div id="request" className="table-container table-container-requests">
      <span className="filler" />

      <ArrowNavigationTable
        {...props}
        tableType="request"
        data={requests}
        reset={setReset}
        columns={columns}
        defaultPageSize={10}
        defaultSorted={defaultSort}
      />
    </div>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(RequestTable);
