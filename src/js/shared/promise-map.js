import { random } from "lodash";
export const newPromiseMap = () => {
  const map = {};
  const add = (res, rej = null) => {
    const chan = random(0, 100000);
    map[chan] = { res, rej };
    return chan;
  };
  const reject = (err, chan = -1) => {
    if (chan === -1) {
      console.error("No channel found");
      return;
    }
    const { rej } = map[chan];
    if (!rej) {
      console.error(`Couldn't find the promise with channel ${chan}`);
    }

    delete map[chan];
    rej(err);
  };
  const resolve = (data, chan = -1) => {
    if (chan === -1) {
      console.error(`No channel found`);
      return;
    }
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
