import { connect } from "react-redux";
import MetaView from "../components/MetaView";
import * as utils from "../utils";

const mapStateToProps = state => {
  const t = utils.firstElemByID(state.tracers, state.selectedTracerID) || {};
  return {
    isGeneratedTracerString: t.TracerString
      ? t.TracerString.startsWith("GEN")
      : false
  };
};

export default connect(mapStateToProps)(MetaView);
