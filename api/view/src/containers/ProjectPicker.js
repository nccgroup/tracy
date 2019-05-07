import { connect } from "react-redux";
import ProjectPicker from "../components/ProjectPicker";
import { delProject, updateProjects, selectProject } from "../actions";

const mapStateToProps = state => ({
  proj: state.proj,
  projs: state.projs
});

const mapDispatchToProps = dispatch => ({
  delProject: i => dispatch(delProject(i)),
  selectProject: proj => dispatch(selectProject(proj)),
  updateProjects: projs => dispatch(updateProjects(projs))
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectPicker);
