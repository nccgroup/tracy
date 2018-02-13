import React, { Component } from "react";
import FilterButton from "./FilterButton";

class FilterColumn extends Component {
	constructor(props) {
		super(props);

		this.isInLocalStorage = this.isInLocalStorage.bind(this);
		this.filterArchivedTracers = this.filterArchivedTracers.bind(this);
		this.filterArchivedContexts = this.filterArchivedContexts.bind(this);
	}

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
	filterResponse(context) {
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
			<div>
				<FilterButton
					value="responses"
					description="HTTP Responses"
					handleChange={this.props.handleChange}
					filter={this.filterResponse}
				/>
				<FilterButton
					value="text"
					description="setInnerText Events"
					handleChange={this.props.handleChange}
					filter={this.filterTextNodes}
				/>
				<FilterButton
					value="inactive"
					description="Tracers Without Events"
					handleChange={this.props.handleChange}
					filter={this.filterInactive}
				/>
			</div>
		);
	}
}

/* Not really sure if I want these filters anymore. Archives weren't that useful
 and responses are def not that useful. 
				<FilterButton
					value="archivedContexts"
					description="Archived Contexts"
					handleChange={this.props.handleChange}
					filter={this.filterArchivedContexts}
				/>
				<FilterButton
					value="archivedTracers"
					description="Archived Tracers"
					handleChange={this.props.handleChange}
					filter={this.filterArchivedTracers}
				/> */

export default FilterColumn;
