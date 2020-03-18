const button = document.getElementById("runAllTests");
button.addEventListener("click", e => {
  runAllTests(tests);
});

const basicInnerHTMLTest = async pg => {
  const [_, tp] = await createTracer();
  pg.body.innerHTML = `'"<${tp}>`;

  // 2 seconds for the dom-mutations batching and 2 seconds for
  // the jobs batching
  await sleep(4);
  const events = await database.getTracerEventsByPayload(tp);
  return basicInnerHTMLTestCheck(events);
};

const basicInnerHTMLTestCheck = events => {
  if (!expectEqual(events.length, 1, "number of events")) {
    return false;
  }

  const event = events.pop();
  if (!expectEqual(event.EventType, EventTypes.innerHTML, "event type")) {
    return false;
  }

  return true;
};

const basicHTTPTest = async pg => {
  const [_, tp] = await createTracer();
  // Test we get events in all of these locations of the fetch
  await Promise.all([
    fetch(`https://www.example.com?q=${tp}`),
    fetch(`https://www.example.com/${tp}`),
    fetch(`https://www.example.com?q=1#${tp}`),
    fetch(`https://www.example.com`, {
      method: "POST",
      body: `q=${tp}`
    }),
    fetch(`https://www.example.com`, {
      method: "POST",
      body: JSON.stringify({ q: tp })
    }),
    fetch(`https://www.example.com`, {
      method: "POST",
      headers: {
        TestHeader: tp
      },
      body: `q=${tp}`
    })
  ]);

  // 2 seconds for sleeping for the jobs batching and HTTP response
  // delay.
  await sleep(4);
  const tracers = await database.getTracers();
  const reqs = tracers.filter(t => t.TracerPayload === tp).pop().Requests;

  return basicHTTPTestCheck(reqs);
};

const basicHTTPTestCheck = reqs => {
  if (!expectEqual(reqs.length, 6, "number of requests")) {
    return false;
  }

  return true;
};

const formTestDotSubmit = async pg => {
  const form = pg.createElement("form");
  form.method = "GET";
  form.action = "#";
  const input = pg.createElement("input");
  input.type = "text";
  input.name = "some vale";

  form.appendChild(input);
  console.log(form.outerHTML);
  pg.write(form.outerHTML);
  pg.forms[0].children[0].value = "zzXSSzz";
  const tracersBefore = await database.getTracers();
  pg.forms[0].submit();
  await sleep(4);
  const tracersAfter = await database.getTracers();
  if (
    !expectEqual(
      tracersBefore.length,
      tracersAfter.length - 1,
      "number of tracers"
    )
  ) {
    return false;
  }

  return true;
};

const tests = [
  {
    name: "Basic innerHTML test",
    description:
      "Test ensures that innerHTML DOM writes properly trigger a sev 3 event.",
    test: basicInnerHTMLTest
  },
  {
    name: "Basic HTTP test",
    description:
      "Test ensures that all elements of an HTTP request are checked for tracer payloads.",
    test: basicHTTPTest
  },
  {
    name: "Form test .submit",
    description:
      "Test ensures all tracers are converted in forms using the .submit method.",
    test: formTestDotSubmit
  }
];

const sleep = async s => await new Promise(r => setTimeout(r, 1000 * s));

const expectEqual = (ans, expected, desc) => {
  if (ans !== expected) {
    log(`Wrong ${desc}. Expected ${expected}, got ${ans}`, true);
    return false;
  }
  return true;
};

const createTracer = async () => {
  const { tracers } = replace.str("zzXSSzz");
  const [tracer, ..._] = tracers;
  tracer.Severity = 0;
  tracer.HasTracerEvents = false;
  tracer.Requests = [];
  await database.addTracer(tracer);

  return [tracer.TracerString, tracer.TracerPayload];
};

const log = (text, error) => {
  const span = document.createElement("div");

  span.innerText = `[${new Date().toUTCString()}]${
    error ? `[ERROR]: ${text}` : `[LOG]: ${text}`
  }`;
  if (error) {
    span.style = "color:red";
  }
  document.body.appendChild(span);
};

const setupTestPlayground = () => {
  const p = document.createElement("iframe");

  const pg = document.getElementById("playground");
  pg.appendChild(p);
  p.contentWindow.document.open();
  p.contentWindow.document.write(`<head></head><body></body>`);
  return p;
};

const testLifecycle = async ({ name, test }) => {
  const pg = document.getElementById("playground");
  const [obs, config] = observer;
  obs.observe(pg, config);
  log(`Running test [${name}]`);
  // Each test gets their own div to play around with
  const p = setupTestPlayground();
  const didPass = await test(p.contentWindow.document);
  p.contentWindow.document.close();
  if (!didPass) {
    log(`Test [${name}] fail`, true);
  } else {
    log(`Test [${name}] passed!`);
  }
  log(`Finished test [${name}]`);
};

const runAllTests = async tests => {
  log("Running all tests");
  await Promise.all(tests.map(testLifecycle));
  log("Test suite finished");
};
