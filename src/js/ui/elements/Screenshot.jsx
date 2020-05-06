import React from "react";

export const Screenshot = (props) => {
  if (!props.screenshot) {
    return <span>no screenshot available...</span>;
  }

  return (
    <img
      className="tracy-screenshot"
      src={props.screenshot}
      title="tracy-screenshot"
      alt="tracy-screenshot"
    />
  );
};
