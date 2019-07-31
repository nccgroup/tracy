import { connect } from "react-redux";
import App from "../components/App";

const mapStateToProps = state => ({
  appInitialized: state.appInitialized,
  onSettingsPage: state.onSettingsPage
});

export default connect(mapStateToProps)(App);
