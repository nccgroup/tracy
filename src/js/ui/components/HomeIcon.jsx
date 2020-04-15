import React from "react";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
const HomeIcon = props => {
  return (
    <div
      title="home"
      className="home-icon clickable"
      onClick={() => props.navigateToUIPage()}
    >
      <FontAwesomeIcon icon="home" />
    </div>
  );
};
export default HomeIcon;
