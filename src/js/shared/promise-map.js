export const newPromiseMap = () => {
  const map = {};
  let i = 0;
  const resetLength = 32000;
  const add = (res, rej = null) => {
    const chan = i++ % resetLength;
    map[chan] = { res, rej };
    return chan;
  };
  const reject = (err, chan) => {
    const { rej } = map[chan];
    if (!rej) {
      console.error(`Couldn't find the promise with channel ${chan}`);
    }

    delete map[chan];
    rej(err);
  };
  const resolve = (data, chan) => {
    const { res } = map[chan];
    if (!res) {
      console.error(`Couldn't find promise with channel ${chan}`);
      return;
    }

    delete map[chan];
    res(data);
  };
  return {
    add,
    resolve,
    reject,
  };
};
