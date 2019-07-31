import React, { PureComponent } from "react";
import ReactDOM from "react-dom";
import HighLight from "react-syntax-highlight";
import "../../node_modules/highlight.js/styles/atom-one-dark.css";

class HighlightedElement extends PureComponent {
  componentDidMount = () => {
    const node = ReactDOM.findDOMNode(this);
    if (node) {
      this.highlightSelection(node);
    }
  };

  componentDidUpdate = () => {
    const node = ReactDOM.findDOMNode(this);
    if (node) {
      this.highlightSelection(node);
    }
  };

  highlightSelection = node => {
    let textNodes = this.textNodesUnder(node);
    let highlightIndex = -1;
    if (textNodes && textNodes.length > 0) {
      for (let i = 0; i < textNodes.length; i++) {
        const data = textNodes[i].data;
        const idx = data.indexOf(this.props.highlightString);
        if (idx !== -1) {
          const pre = data.substring(0, idx);
          const highlight = data.substring(
            idx,
            idx + this.props.highlightString.length
          );
          const post = data.substring(
            idx + this.props.highlightString.length,
            data.length
          );
          let styledSpan = document.createElement("span");
          styledSpan.classList.add("highlight");
          styledSpan.innerText = highlight;

          let preSpan = document.createElement("span");
          preSpan.innerText = pre;

          let postSpan = document.createElement("span");
          postSpan.innerText = post;

          let parent = textNodes[i].parentNode;

          // For attributes, we can just take the parent node and add
          // our newly generated nodes because attribute names and values
          // get wrapped in a div. The classnames that define if its an attribute
          // are below:

          // hljs is the root node of the <code> tage
          if ([...parent.classList].includes("hljs")) {
            const sibling = textNodes[i].previousSibling;
            let topDiv;
            if (sibling) {
              topDiv = sibling;
            } else {
              // This case only happens when there is only one line in the code snippet
              // and there aren't any siblings
              topDiv = parent;
            }

            topDiv.appendChild(preSpan);
            topDiv.appendChild(styledSpan);
            topDiv.appendChild(postSpan);
          } else {
            parent.appendChild(preSpan);
            parent.appendChild(styledSpan);
            parent.appendChild(postSpan);
          }
          parent.removeChild(textNodes[i]);

          highlightIndex++;
          if (highlightIndex === this.props.highlightOffset) {
            styledSpan.scrollIntoView();
          }
        }
      }
    }
  };

  textNodesUnder = el => {
    let n,
      a = [],
      walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    while ((n = walk.nextNode())) a.push(n);
    return a;
  };

  render = () => {
    if (!this.props.data) return <span />;
    return (
      <HighLight
        className="raw-data"
        lang={this.props.lang}
        value={this.props.data}
      />
    );
  };
}

export default HighlightedElement;
