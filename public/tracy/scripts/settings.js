const settings = (() => {
  // Stolen from : https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  const generateUUID = () =>
    ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  let disabled = false;

  // add the default tracers to the local storage
  store.set({ tracerPayloads: DefaultTracerTypes });

  // configQuery returns the appropriate configuration information
  // that is requested from the content script.
  const query = async ({ config }, _, sendResponse) => {
    switch (config) {
      case "tracer-string-types":
        const tps = await getTracerStrings();
        sendResponse(tps.tracerPayloads);
        break;
      case "disabled":
        sendResponse(disabled);
        break;
    }
  };

  const getTracerStrings = async () => await store.get({ tracerPayloads: [] });
  const getAPIKey = async () => {
    let { apiKey } = await store.get({ apiKey: "" });
    if (!apiKey) {
      apiKey = generateUUID();
      store.set({ apiKey: apiKey });
    }
    return apiKey;
  };

  return {
    getTracerStrings: getTracerStrings,
    getAPIKey: getAPIKey,
    isDisabled: () => disabled,
    setDisabled: b => (disabled = b),
    query: query
  };
})();
