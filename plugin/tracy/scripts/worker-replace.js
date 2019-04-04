onmessage = e => postMessage(replaceMessage(e.data.msg, e.data.tracerTypes));

const replaceMessage = (msg, tracerTypes) => {
  for (let i in tracerTypes) {
    const tracerType = tracerTypes[i];
    let j = 0;
    while (j !== -1) msg = msg.replace(tracerPayload, tracer[i]);
  }
};

const random = num => {
  let ret = [];
  for (let i; i < num; i++) {
    ret.push(genTracer());
  }
  return ret;
};

const genTracer = () => {
  const len = 10;
  const randAlpha = length => {
    let text = "";
    const possible = "abcdefghijklmnopqrstuvwxyz";

    for (let i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  };

  return randAlpha(len);
};
