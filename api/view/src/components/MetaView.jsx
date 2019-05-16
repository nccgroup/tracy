import React, { Component } from "react";
import PropertiesTable from "../containers/PropertiesTable";
import GeneratedMetaView from "../containers/GeneratedMetaView";
import NonGeneratedMetaView from "../containers/NonGeneratedMetaView";
export default class MetaView extends Component {
  render = () => {
    return (
      <div className="meta-view">
        {this.props.isGeneratedTracerString ? (
          <GeneratedMetaView />
        ) : (
          <NonGeneratedMetaView />
        )}
        <PropertiesTable />
      </div>
    );
  };
}
