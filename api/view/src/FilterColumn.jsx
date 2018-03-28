import React, { Component } from "react";
import FilterButton from "./FilterButton";
import Nav from "react-bootstrap/lib/Nav";

class FilterColumn extends Component {
	// Helper to see if an element is in localStorage.
	isInLocalStorage(key, ID) {
		var ret;
		try {
			ret = JSON.parse(localStorage.getItem(key)).indexOf(ID) > -1;
		} catch (e) {
			ret = false;
		}
		return ret;
	}

	// filterResponses filters out events that have the event type of response.
	filterResponses(context) {
		return context.EventType.toLowerCase() !== "response";
	}

	// filterArchivedTracers filters out events and tracers that have been archived.
	filterArchivedTracers(tracer) {
		return !this.isInLocalStorage("archivedTracers", tracer.ID);
	}

	// filterArchives filters out events and tracers that have been archived.
	filterArchivedContexts(context) {
		return !this.isInLocalStorage("archivedContexts", context.ID);
	}

	// filterInactive filters out tracers that have no events or contexts.
	filterInactive(tracer) {
		return tracer.TracerEventsLength > 0;
	}

	// filterTextNodes filters our events that are text nodes.
	filterTextNodes(context) {
		return context.EventType.toLowerCase() !== "text";
	}

	render() {
		return (
			<Nav pullRight>
				<FilterButton
					name="text"
					eventKey={1}
					imgType="glyph"
					img="text-size"
					handleChange={this.props.handleFilterChange}
					filter={this.filterTextNodes}
					description="Filter out text nodes"
				/>
				<FilterButton
					name="responses"
					eventKey={2}
					imgType="icon"
					img="reply"
					handleChange={this.props.handleFilterChange}
					filter={this.filterResponses}
					description="Filter out HTTP responses"
				/>
				<FilterButton
					name="inactive"
					eventKey={3}
					imgType="glyph"
					img="filter"
					handleChange={this.props.handleFilterChange}
					filter={this.filterInactive}
					description="Filter out inactive tracers"
				/>
			</Nav>
		);
	}
}

export default FilterColumn;
