import { EventTypes } from "./constants";
import { random } from "lodash";
export const channel = (() => {
  const send = (msg) => {
    const chan = random(0, 100000);
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
