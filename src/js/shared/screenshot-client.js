import { Strings } from "./constants";
import { getElementByNameAndValue } from "./ui-helpers";
import { newTracer } from "./rpc";
// captureSceenshot sends a command to the background page
// take a screenshot given the dimensions specified by the
// frame element of the target passed in. padding is the amount
// of space on each side of the element
export const takeAndAddTracer = async (rpc, elem, tracer, padding = 0) => {
  elem.classList.add(Strings.SCREENSHOT);
  const rec = document.body.getBoundingClientRect();
  const dim = {
    top: rec.top - padding,
    left: rec.left - padding,
    width: rec.width + 2 * padding,
    height: window.innerHeight + 2 * padding,
    ratio: 1,
  };
  const t = newTracer(tracer);
  await rpc.captureScreenshot(dim, t);

  elem.classList.add(Strings.SCREENSHOT_DONE);
  elem.classList.remove(Strings.SCREENSHOT);
};

export const takeFormAndAddTracers = async (rpc, form, tracers) => {
  const proms = [...new FormData(form)].map(([nameAttr, value]) => {
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
    return takeAndAddTracer(rpc, elem, t);
  });

  await Promise.all(proms);
};
