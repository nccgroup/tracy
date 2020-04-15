import React, { Component } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { createKeyDownHandler, mod } from "../../shared/ui-helpers";

// If the page index goes from top to bottom or vice versa,
// we knoew we are flipping the page.
const calcPageFlipped = (prev, curr, size) => {
  return [Math.abs(prev - curr) >= size - 1, prev - curr < 0 ? -1 : 1];
};

export default class TracerEventsTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pages: Math.ceil(this.props.data.length / this.props.defaultPageSize),
      pageRows: this.props.pageSize,
      page: 0,
      pageIndex: 0,
      tableIndex: 0,
    };
  }

  componentDidMount() {
    createKeyDownHandler(
      this.props.tableType,
      () => this.props.lastSelectedTable,
      () => {
        this.setState((prevState) => {
          const nextPageIdx = mod(prevState.pageIndex - 1, this.state.pageRows);
          const [wasPageFlipped, pageDirection] = calcPageFlipped(
            prevState.pageIndex,
            nextPageIdx,
            this.state.pageRows
          );

          this.props.selectRow(nextPageIdx, -1, false, null);
          return {
            pageIndex: nextPageIdx,
            tableIndex: -1,
            page: wasPageFlipped
              ? mod(prevState.page + pageDirection, this.state.pages)
              : prevState.page,
          };
        });
      },
      () => {
        this.setState((prevState) => {
          const nextPageIdx = mod(prevState.pageIndex + 1, this.state.pageRows);
          const [wasPageFlipped, pageDirection] = calcPageFlipped(
            prevState.pageIndex,
            nextPageIdx,
            this.state.pageRows
          );
          this.props.selectRow(nextPageIdx, -1, false, null);
          return {
            pageIndex: nextPageIdx,
            tableIndex: -1,
            page: wasPageFlipped
              ? mod(prevState.page + pageDirection, this.state.pages)
              : prevState.page,
          };
        });
      }
    );
  }

  render() {
    const pages = Math.ceil(
      this.props.data.length / this.props.defaultPageSize
    );
    if (this.state.pages !== pages) {
      this.setState((prevState) => ({ pages: pages }));
    }

    return (
      <ReactTable
        {...this.props}
        className="grow-table"
        loading={this.props.loading}
        loadingText="Loading..."
        page={this.state.page}
        showPageSizeOptions={false}
        showPageJump={false}
        onPageChange={(pageIndex) => {
          this.setState((state) => ({
            page: pageIndex,
          }));
        }}
        getTableProps={(s) => {
          if (this.state.pageRows !== s.pageRows.length) {
            this.setState((prevState) => ({
              pageRows: s.pageRows.length,
              pageIndex: prevState.pageIndex === 0 ? 0 : s.pageRows.length - 1,
              tableIndex: -1,
            }));
          }
          return {};
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

            if (rowInfo.viewIndex === this.state.pageIndex) {
              // -1 indicates we used a relative row movement and can't know the actual data
              // we moved to because of different sorting. At this point, we will know which
              // row in the viewable table, though. Use that value to grab whatever is data is
              // there.
              if (this.state.tableIndex < 0) {
                this.props.selectRow(
                  this.state.pageIndex,
                  rowInfo.row.ID,
                  false,
                  rowInfo.row
                );
                this.setState((prevState) => ({
                  tableIndex: rowInfo.row.ID,
                }));
              } else if (this.state.tableIndex === rowInfo.row.ID) {
                classname += " row-selected";
              }
            }

            return {
              onClick: (e, handleOriginal) => {
                this.setState((prevState) => ({
                  pageIndex: rowInfo.viewIndex,
                  tableIndex: rowInfo.row.ID,
                }));
                this.props.selectRow(
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
          } else {
            return {};
          }
        }}
      />
    );
  }
}
