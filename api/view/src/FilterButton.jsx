import React, { PureComponent } from "react";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";

class FilterButton extends PureComponent {
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
		let value;
		try {
			value = evt.currentTarget.id;
		} catch (e) {
			value = evt;
		}
		const toggle = !this.state.enabled;
		if (!toggle) {
			this.props.handleChange(value, false);
			this.remove(value);
		} else {
			this.props.handleChange(value, this.props.filter);
			// Since the filter is enabled, add it to localStorage to be saved on refresh
			this.store(value);
		}

		this.setState(function(prevState) {
			return {
				enabled: !prevState.enabled
			};
		});
	}

	render() {
		let img = "";
		let className = this.state.enabled
			? "filter-active"
			: "filter-inactive";
		if (this.props.imgType === "icon") {
			img = (
				<FontAwesomeIcon className={className} icon={this.props.img} />
			);
		} else if (this.props.imgType === "glyph") {
			img = <Glyphicon className={className} glyph={this.props.img} />;
		}

		return (
			<div
				className="filter-button"
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

export default FilterButton;
