import { EventTypes } from "../shared/constants";

const reactValueTrackerHandler = (elem) => ({
  detail: { newValue, oldValue },
}) => {
  elem.value = newValue;
  const { _valueTracker } = elem;
  if (_valueTracker) {
    _valueTracker.setValue(oldValue);
  }
  const ievent = new Event("input", { bubbles: true });
  const cevent = new Event("change", { bubbles: true });
  ievent.simulated = true;
  cevent.simulated = true;
  elem.dispatchEvent(ievent);
  elem.dispatchEvent(cevent);
};

const getElemIdenifier = (elem) => {
  const id = elem.id ? elem.id : -1;
  const name = elem.name ? elem.name : "noname";
  return `${elem.nodeName}:${id}:${name}`;
};

export const valueTrackerModInit = () => {
  const valueTracker = {};
  Object.defineProperty(Element.prototype, "_valueTracker", {
    get: function () {
      return valueTracker[getElemIdenifier(this)];
    },
    set: function (value) {
      const elemID = getElemIdenifier(this);
      window.addEventListener(
        `${EventTypes.TracyResponse}-${elemID}`,
        reactValueTrackerHandler(this),
        { passive: true }
      );

      valueTracker[elemID] = value;
    },
  });
};
