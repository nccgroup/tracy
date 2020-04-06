const channel = (() => {
  const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const send = msg => {
    const channel = getRandomInt(0, 100000);
    return new Promise(res => {
      window.addEventListener(
        `tracyResponse-${channel}`,
        ({ detail }) => res(detail),
        {
          once: true
        }
      );

      const event = new CustomEvent("tracyMessage", {
        detail: {
          ...msg,
          channel: channel
        }
      });
      window.dispatchEvent(event);
    });
  };
  return { send: send };
})();
