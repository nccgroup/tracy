import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import atomOneDark from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark";

const highlightStyle = { style: { backgroundColor: "yellow" } };
const codeTagStyle = {
  style: {
    fontSize: "small",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    overflow: "hidden",
  },
};
const customStyle = {
  overflow: "hidden",
};

const HighlightedElement = (props) => {
  if (props.loading) return <span>loading...</span>;
  return (
    <SyntaxHighlighter
      style={atomOneDark}
      wrapLines={true}
      language={props.lang}
      customStyle={customStyle}
      codeTagProps={codeTagStyle}
      lineProps={(ln) => (props.highlightOffset === ln ? highlightStyle : {})}
    >
      {props.data}
    </SyntaxHighlighter>
  );
};

export default HighlightedElement;
