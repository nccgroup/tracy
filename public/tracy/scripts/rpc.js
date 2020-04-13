const tracyRPC = (() => {
  const newTracer = (tracer) =>
    Object.assign(
      {},
      { Requests: [], Severity: 0, HasTracerEvents: false, Screenshot: null },
      tracer
    );

  const addTracer = async (tracer) =>
    await channel.send({
      tracer: newTracer(tracer),
      ...MessageTypes.AddTracer,
    });

  const captureScreenshot = async () =>
    await channel.send(MessageTypes.Screenshot);

  const bulkJobs = async (location, msg) =>
    await channel.send({
      ...MessageTypes.BulkJobs,
      location,
      msg,
    });

  const innerHTMLJob = async (msg, extras, location) =>
    await channel.send({
      ...MessageTypes.InnerHTML,
      msg,
      extras,
      location,
    });

  const getTracerStrings = async () =>
    await channel.send(MessageTypes.GetTracerStrings);

  return {
    addTracer: addTracer,
    getTracerStrings: getTracerStrings,
    captureScreenshot: captureScreenshot,
    bulkJobs: bulkJobs,
    innerHTMLJob: innerHTMLJob,
  };
})();
