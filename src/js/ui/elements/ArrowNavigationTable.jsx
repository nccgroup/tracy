import React, { useState, useEffect, useRef } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { createKeyDownHandler, mod } from "../../shared/ui-helpers";
import { Severity } from "../../shared/constants";

// If the page index goes from top to bottom or vice versa,
// we knoew we are flipping the page.
const calcPageFlipped = (prev, curr, size) => Math.abs(prev - curr) >= size - 1;
const findAdjacentIDsByID = (data, id) => {
  if (data.length === 0) {
    return [1, 1];
  }
  let left = data.length - 1;
  let right = 1 % data.length;
  let i = 0;
  for (
    i;
    i < data.length;
    i++, right = (right + 1) % data.length, left = (left + 1) % data.length
  ) {
    if (data[i].ID == id) {
      break;
    }
  }
  return [data[left].ID, data[right].ID];
};

// the number of rows with data in them
const numRows = 10;
const rowSelected = "row-selected";

const ArrowNavigationTable = (props) => {
  // keep track of the left and right IDs of the currently sorted table
  // so that selecting them with the arrow keys is simpler
  const [numData] = useState(props.data.length);
  const [adjIDs, setAdjacentIDs] = useState([]);
  const tableRef = useRef(null);
  // the total number of rows available
  const numPages = Math.ceil(props.data.length / props.defaultPageSize);

  // the current page number
  const [curPage, setCurPage] = useState(0);

  // the index of the row selected, the page it was selected on,
  // and the ID field of the selected entry
  const [selectedPageRow, setSelectedPageRow] = useState(0);

  const keyDownHandler = (direction) => {
    // get the next index on the page. if we flipped a page, we
    // loop from top to bottom and bottom to top
    let numDataRows = numRows;
    // If we are on the last page, we might not have a full page of data rows
    if (curPage + 1 === numPages && direction === 1) {
      numDataRows = props.data.length % numRows;
    }

    // if we are flipping to the front page to the back page, we need to know what
    // row we can select
    else if (curPage === 0 && direction === -1 && selectedPageRow === 0) {
      numDataRows = props.data.length % numRows;
    }

    const nextSelectedRow = mod(selectedPageRow + direction, numDataRows);

    // if page was flipped
    const wasPageFlipped = calcPageFlipped(
      selectedPageRow,
      nextSelectedRow,
      numDataRows
    );
    const nextPage = wasPageFlipped
      ? mod(curPage + direction, numPages)
      : curPage;

    setSelectedPageRow(nextSelectedRow);

    if (wasPageFlipped) {
      setCurPage(nextPage);
    }

    const [leftID, rightID] = adjIDs;
    const directionID = direction === -1 ? leftID : rightID;
    setAdjacentIDs(
      findAdjacentIDsByID(tableRef.current.state.sortedData, directionID)
    );
    props.selectRow(directionID, false);
  };

  useEffect(() => {
    return createKeyDownHandler(
      props.tableType,
      () => props.lastSelectedTable,
      () => keyDownHandler(-1),
      () => keyDownHandler(1)
    );
  }, [props.lastSelectedTable, curPage, selectedPageRow, adjIDs]);

  const reset = () => {
    setCurPage(0);
    setAdjacentIDs([]);
    setSelectedPageRow(0);
  };
  useEffect(() => {
    if (props.reset) {
      props.reset(reset);
    }
    // if the table was initalized with data, select a default row
    if (props.data.length > 0) {
      const data = tableRef.current.state.sortedData;
      const ID = props.selectedID === -1 ? data[0].ID : props.selectedID;
      setAdjacentIDs(findAdjacentIDsByID(data, ID));
      props.selectRow(ID, false);
    }
  }, []);

  return (
    <ReactTable
      {...props}
      className="grow-table"
      loading={props.loading}
      loadingText="Loading..."
      ref={tableRef}
      page={curPage}
      showPageSizeOptions={false}
      showPageJump={false}
      onPageChange={(pageIndex) => setCurPage(pageIndex)}
      getTrProps={(state, rowInfo) => {
        if (!rowInfo) {
          return {};
        }
        let classname = Severity[rowInfo.row.Severity];

        // if we are on the page of our currently selected row and we are the row of the currently
        // selected row.
        if (rowInfo.row.ID === props.selectedID) {
          classname += ` ${rowSelected}`;
        }

        return {
          onClick: (_, handleOriginal) => {
            setSelectedPageRow(rowInfo.viewIndex);
            setAdjacentIDs(
              findAdjacentIDsByID(state.sortedData, rowInfo.row.ID)
            );
            props.selectRow(rowInfo.row.ID, true);

            if (handleOriginal) {
              handleOriginal();
            }
          },
          className: classname,
        };
      }}
    />
  );
};

export default ArrowNavigationTable;
