import { EventTypes } from "./constants";

export const channel = (() => {
  const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const send = (msg) => {
    const chan = getRandomInt(0, 100000);
    return new Promise((res) => {
      window.addEventListener(
        `${EventTypes.TracyResponse}-${chan}`,
        ({ detail }) => res(detail),
        {
          once: true,
        }
      );

      const event = new CustomEvent(EventTypes.TracyMessage, {
        detail: {
          ...msg,
          chan: chan,
        },
      });
      window.dispatchEvent(event);
    });
  };

  return { send: send };
})();
