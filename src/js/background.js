import { routerInit } from "./ext/router";
import { requestCaptureInit } from "./ext/request-capture";
import { userActionInit } from "./ext/user-action";
import { hotReloadInit } from "./ext/hot-reload";
import { addTracer, addEvent, getRawEvent } from "./ext/database";
if (DEV) {
  hotReloadInit();

  /*
  const encoder = new TextEncoder();
  const tracer = {
    TracerPayload: "TEST",
    TracerString: "zzPLAINzz",
    Requests: [],
    Severity: 0,
    HasTracerEvents: false,
    Screenshot: null,
  };

  const event = {
    RawEvent: encoder.encode("TESTTESTTEST1"),
    RawEventIndex: 0,
    TracerPayload: "TEST",
    Location: "http://www.example.com",
    Severity: 3,
    HTMLNodeType: "DIV",
    HTMLLocationType: "dom",
  };

  (async () => {
    let addedEventID;
    try {
      console.log("adding a tracer", tracer);
      await addTracer(tracer);
      console.log("added tracer. adding an event", event);
      addedEventID = await addEvent(event);
      console.log("added event. adding the same event", event);
      await addEvent(event);
      console.log(
        "add! I think we should have got a duplicate error issue here"
      );
    } catch (e) {
      console.error(e);
    }

    try {
      console.log("getting the raw event", event);
      const rawEvent = await getRawEvent(addedEventID);
      console.log("got somethings!", rawEvent);
    } catch (e) {
      console.error(e);
    }
  })();*/
}

routerInit();
userActionInit();
requestCaptureInit();
