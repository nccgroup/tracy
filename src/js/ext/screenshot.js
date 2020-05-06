import { Strings } from "../shared/constants";
import { addTracer } from "./database";
// takeAndAddTracer takes a screenshot of the requesting tab,
// and adds it to the provided tracer and inserts it into the databae.
const dataURLtoBlob = (dataurl) => {
  let arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};
export const takeAndAddTracer = async ({ tracer, dim }, sender) => {
  const dURI = await captureScreenshot(sender.tab.id);

  (async () => {
    const cropped = await cropImage(dURI, dim);
    submitData(tracer, cropped);
  })();
  return true;
};

const submitData = async (tracer, ss) => {
  tracer.Screenshot = ss;
  await addTracer(tracer);
  return true;
};

// Given an data URI and dimensions, create an Image and use the canvas
// to draw the image. Return a blob of the cropped image.
const cropImage = (dURI, dim) => {
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
      canvas.toBlob(res);
    };
    img.src = dURI;
  });
};

// captureScreenshot creates an image of that tab with the specified dimensions
// and offset.
const captureScreenshot = async (tabID) => {
  const tab = await new Promise((r) => chrome.tabs.get(tabID, (tab) => r(tab)));
  return await new Promise((r) =>
    chrome.tabs.captureVisibleTab(tab.windowId, { format: Strings.PNG }, (d) =>
      r(d)
    )
  );
};
