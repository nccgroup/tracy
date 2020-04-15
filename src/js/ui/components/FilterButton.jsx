import React, { PureComponent } from "react";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";

export default class FilterButton extends PureComponent {
  handleClick = evt => {
    this.props.toggleFilter(this.props.filter);
  };

  render = () => {
    let className = this.props.enabled ? "filter-active" : "filter-inactive";
    const img = <FontAwesomeIcon icon={this.props.img} />;

    return (
      <li
        className={`${className} clickable`}
        id={this.props.name}
        title={this.props.description}
        onClick={this.handleClick}
        href="#"
      >
        {img}
      </li>
    );
  };
}
