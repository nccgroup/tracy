import React, { useState, useEffect, useRef } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { createKeyDownHandler, mod } from "../../shared/ui-helpers";
import { Severity } from "../../shared/constants";

// If the page index goes from top to bottom or vice versa,
// we knoew we are flipping the page.
const calcPageFlipped = (prev, curr, size) => Math.abs(prev - curr) >= size - 1;

// the number of rows with data in them
const numRows = 10;
const rowSelected = "row-selected";

const ArrowNavigationTable = (props) => {
  // keep track of the left and right IDs of the currently sorted table
  // so that selecting them with the arrow keys is simpler
  const [adjIDs, setAdjacentIDs] = useState([]);
  const tableRef = useRef(null);
  // the total number of rows available
  const numPages = Math.ceil(props.data.length / props.defaultPageSize);

  // the current page number
  const [curPage, setCurPage] = useState(0);

  // the index of the row selected and the page it was selected on
  const [
    [selectedPageRow, selectedPage],
    setSelectedPageRowAndPage,
  ] = useState([0, 0]);

  const findAdjacentIDsByID = (data, id) => {
    let left = data.length - 1;
    let right = 1;
    for (
      let i = 0;
      i < data.length;
      i++, right = (right + 1) % data.length, left = (left + 1) % data.length
    ) {
      if (data[i].ID == id) {
        break;
      }
    }

    return [data[left].ID, data[right].ID];
  };

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
    if (curPage === 0 && direction === -1 && selectedPageRow === 0) {
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

    setSelectedPageRowAndPage([nextSelectedRow, nextPage]);

    if (wasPageFlipped) {
      setCurPage(nextPage);
    }

    const [leftID, rightID] = adjIDs;
    const directionID = direction === -1 ? leftID : rightID;
    setAdjacentIDs(
      findAdjacentIDsByID(tableRef.current.state.sortedData, directionID)
    );
    props.selectRow(nextSelectedRow, directionID, false);
  };

  useEffect(
    () =>
      createKeyDownHandler(
        props.tableType,
        () => props.lastSelectedTable,
        () => keyDownHandler(-1),
        () => keyDownHandler(1)
      ),
    [props.lastSelectedTable, curPage, selectedPageRow, adjIDs]
  );

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
        if (curPage === selectedPage && selectedPageRow === rowInfo.viewIndex) {
          classname += ` ${rowSelected}`;
        }

        return {
          onClick: (_, handleOriginal) => {
            setSelectedPageRowAndPage([rowInfo.viewIndex, curPage]);
            setAdjacentIDs(
              findAdjacentIDsByID(state.sortedData, rowInfo.row.ID)
            );
            props.selectRow(
              rowInfo.viewIndex,
              rowInfo.row.ID,
              true,
              rowInfo.row
            );

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
