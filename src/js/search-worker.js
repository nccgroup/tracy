import { findDOMContexts } from "./ext/parse-dom";
import { MessageTypes } from "./shared/constants";
import { search } from "./ext/search-dom";

onmessage = async (e) => {
  const { id } = e.data;
  switch (id) {
    case MessageTypes.SearchString.id:
      const { jobs, tracerPayloads } = e.data;
      // const convertedJobs = await Promise.all(
      //   jobs.map(async (j) => {
      //     const blobURL = j.msg;
      //     const resp = await fetch(blobURL);
      //     const text = await resp.text();
      //     j.msg = text;

      //     return [j, blobURL];
      //   })
      // );
      const domEvents = search(jobs, tracerPayloads);
      postMessage({ id, domEvents });
      break;
    case MessageTypes.ParseDOM.id:
      const { event, nodes } = e.data;
      const parsedEvents = await findDOMContexts(event, nodes);
      postMessage({ id, parsedEvents });
      break;
  }
};
