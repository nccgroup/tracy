import { EventTypes } from "./constants";
let chanCount = 0;
export const channel = (() => {
  const send = (msg) => {
    const chan = chanCount++;
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
