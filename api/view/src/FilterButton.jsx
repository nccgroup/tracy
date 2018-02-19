import React, { Component } from "react";
class FilterButton extends Component {
	constructor(props) {
		super(props);

		this.state = {
			enabled: false
		};

		this.handleClick = this.handleClick.bind(this);
	}

	componentDidMount() {
		// If the value is in localStorage, we need to enable the filter.
		if (this.get(this.props.value)) {
			this.handleClick(this.props.value);
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
		var value = rowKeys;
		if (!Array.isArray(rowKeys)) {
			value = [].concat(rowKeys);
		}
		const key = "filters";
		var old;
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
		var value = rowKeys;
		if (!Array.isArray(rowKeys)) {
			value = [].concat(rowKeys);
		}
		const key = "filters";
		var old;
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
		var value = {};
		try {
			value = evt.target.value;
		} catch (e) {
			value = evt;
		}
		const toggle = !this.state.enabled;
		if (!toggle) {
			this.props.handleChange(value, false);
			this.remove(this.props.value);
		} else {
			this.props.handleChange(value, this.props.filter);
			// Since the filter is enabled, add it to localStorage to be saved on refresh
			this.store(this.props.value);
		}

		this.setState(function(prevState) {
			return {
				enabled: !prevState.enabled
			};
		});
	}

	render() {
		return (
			<button
				type="button"
				className={this.state.enabled ? "button-active" : null}
				id={this.props.value}
				onClick={this.handleClick}
			>
				{this.props.description}
			</button>
		);

		// <div
		// 	className="filter-button"><input
		// 		type="checkbox"
		//     	id={this.props.value}
		//     	value={this.props.value}
		// 		onChange={this.handleChange}
		//     	checked={checked}></input>
		//     <label
		//     	className="filter-button-label">
		// 		{this.props.description}
		// 	</label></div>
	}
}

export default FilterButton;
