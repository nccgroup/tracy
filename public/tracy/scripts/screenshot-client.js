const screenshotClient = (() => {
  // captureSceenshot sends a command to the background page
  // take a screenshot given the dimensions specified by the
  // frame element of the target passed in. padding is the amount
  // of space on each side of the element
  const take = async (e, padding = 0) => {
    e.classList.add(Strings.SCREENSHOT);
    const dURIp = tracyRPC.captureScreenshot();
    const rec = document.body.getBoundingClientRect();
    const dim = {
      top: rec.top - padding,
      left: rec.left - padding,
      width: rec.width + 2 * padding,
      height: window.innerHeight + 2 * padding,
      ratio: 1,
    };
    const { dURI } = await dURIp;
    const imgP = dataURIToImage(dURI, dim);
    e.classList.add(Strings.SCREENSHOT_DONE);
    e.classList.remove(Strings.SCREENSHOT);
    return await imgP;
  };

  const getElementByNameAndValue = (name, value) => {
    const elems = [...document.getElementsByName(name)]
      .filter(
        (n) =>
          n.nodeName.toLowerCase() === Strings.INPUT ||
          n.nodeName.toLowerCase() === Strings.TEXT_AREA
      )
      .filter((n) => value === n.value);
    if (elems.length !== 1) {
      return null;
    }
    return elems.pop();
  };

  const takeForm = async (form, tracers) =>
    (
      await Promise.all(
        [...new FormData(form)].map(async ([nameAttr, value]) => {
          const elem = getElementByNameAndValue(nameAttr, value);
          if (!elem) {
            return null;
          }
          const t = tracers
            .filter((t) => elem.value.indexOf(t.TracerPayload) !== -1)
            .pop();
          if (!t) {
            return null;
          }
          const ss = await screenshotClient.take(elem);
          return { tracer: t, ss: ss };
        })
      )
    ).filter(Boolean);

  // Given an data URI and dimensions, create an Image and use the canvas
  // to draw the image.
  const dataURIToImage = (dURI, dim) => {
    return new Promise((res) => {
      const canvas = document.createElement(Strings.CANVAS);
      const img = new Image();
      const context = canvas.getContext(Strings.TWOD);

      img.onload = () => {
        canvas.width = dim.width;
        canvas.height = dim.height;
        context.drawImage(
          img,
          dim.left,
          dim.top,
          dim.width * dim.ratio,
          dim.height * dim.ratio,
          0,
          0,
          dim.width,
          dim.height
        );

        res(canvas.toDataURL());
      };
      img.src = dURI;
    });
  };

  return { take, takeForm };
})();
