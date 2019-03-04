import React, { Component } from "react";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";

export default class FilterButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      enabled: false
    };

    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    // If the value is in localStorage, we need to enable the filter.
    if (this.get(this.props.name)) {
      this.handleClick(this.props.name);
    }
  }

  get(rowKey) {
    const key = "filters";
    var ret = false;
    try {
      var stored = JSON.parse(localStorage.getItem(key));
      const id = stored.indexOf(rowKey);
      if (id >= 0) {
        ret = true;
      }
    } catch (e) {
      // Nothing to do
    }

    return ret;
  }

  store(rowKeys) {
    let value = rowKeys;
    if (!Array.isArray(rowKeys)) {
      value = [].concat(rowKeys);
    }
    const key = "filters";
    let old;
    try {
      old = JSON.parse(localStorage.getItem(key));
    } catch (e) {
      old = [];
    }

    if (old && Array.isArray(old)) {
      value = old.concat(value);
    }

    //Don't store duplicates
    value = Array.from(new Set(value));

    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(rowKeys) {
    let value = rowKeys;
    if (!Array.isArray(rowKeys)) {
      value = [].concat(rowKeys);
    }
    const key = "filters";
    let old;
    try {
      old = JSON.parse(localStorage.getItem(key));
    } catch (e) {
      old = [];
    }

    if (old && Array.isArray(old)) {
      value = value.reduce(function(accum, curr) {
        const id = accum.indexOf(curr);
        if (id >= 0) {
          accum.splice(id, 1);
          return accum;
        } else {
          return accum;
        }
      }, old);
    }

    localStorage.setItem(key, JSON.stringify(value));
  }

  handleClick(evt) {
    let value;
    try {
      value = evt.currentTarget.id;
    } catch (e) {
      value = evt;
    }
    const toggle = !this.state.enabled;
    if (!toggle) {
      this.remove(value);
    } else {
      // Since the filter is enabled, add it to localStorage to be saved on
      // refresh.
      this.store(value);
    }
    this.props.toggleFilter(this.props.filter);
    this.setState(function(prevState) {
      return {
        enabled: !prevState.enabled
      };
    });
  }

  render() {
    let className = this.state.enabled ? "filter-active" : "filter-inactive";
    const img = <FontAwesomeIcon className={className} icon={this.props.img} />;

    return (
      <div
        className="icon-button"
        id={this.props.name}
        title={this.props.description}
        onClick={this.handleClick}
        href="#"
      >
        {img}
      </div>
    );
  }
}
