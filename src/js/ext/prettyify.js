import prettier from "prettier/standalone";
import parserJSON from "prettier/parser-babel";
import parserHTML from "prettier/parser-html";

const isJSON = (rawEvent) => {
  try {
    JSON.parse(rawEvent);
    return true;
  } catch (e) {}

  return false;
};
const isHTML = (rawEvent) =>
  rawEvent.indexOf("<") !== -1 && rawEvent.indexOf(">") !== -1;

const isJavaScript = (rawEvent) => {
  try {
    return [
      true,
      prettier.format(rawEvent, {
        parser: "babel",
        plugins: [parserJSON],
      }),
    ];
  } catch (e) {}

  return [false, null];
};
export const prettify = (rawEvent) => {
  if (isJSON(rawEvent)) {
    return [
      prettier.format(rawEvent, {
        parser: "json",
        plugins: [parserJSON],
      }),
      "application/json",
    ];
  }

  const [parsed, parsedJS] = isJavaScript(rawEvent);
  if (parsed) {
    return [parsedJS, "application/javascript"];
  }
  if (isHTML(rawEvent)) {
    try {
      const html = prettier.format(rawEvent, {
        parser: "html",
        plugins: [parserHTML],
      });
      return [html, "text/html"];
    } catch (e) {
      return [rawEvent, "text/html"];
    }
  }

  if (DEV) {
    console.error("AHH WHAT IS IT", rawEvent);
  }

  return [rawEvent, "text/html"];
};
