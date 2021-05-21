const DEPS = {
  DOM_MUTATIONS: "../scripts/dom-mutations.js",
  UTIL: "../scripts/util.js",
  HIGHLIGHT: "../scripts/highlight.js",
  HOOKING: "../scripts/method-hooking-injector.js"
};
const button = document.getElementById("runAllTests");
button.addEventListener("click", e => {
  runAllTests(tests);
});

const tests = [
  {
    name: "Basic innerHTML test",
    description:
      "Test ensures that innerHTML DOM writes properly trigger a sev 3 event.",
    test: async pg => {
      const [_, tp] = await createTracer();
      pg.body.innerHTML = `'"<${tp}>`;

      // 2 seconds for the dom-mutations batching and 2 seconds for
      // the jobs batching
      await sleep(4);
      const events = await database.getTracerEventsByPayload(tp);
      if (!expectEqual(events.length, 1, "number of events")) {
        return false;
      }

      const event = events.pop();
      if (!expectEqual(event.EventType, EventTypes.innerHTML, "event type")) {
        return false;
      }

      return true;
    },
    deps: [DEPS.HOOKING, DEPS.UTIL]
  },
  {
    name: "Basic HTTP test",
    description:
      "Test ensures that all elements of an HTTP request are checked for tracer payloads.",
    test: async pg => {
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
      if (!expectEqual(reqs.length, 6, "number of requests")) {
        return false;
      }

      return true;
    },
    deps: [DEPS.HOOKING, DEPS.UTIL]
  },
  {
    name: "Form test .submit",
    Description:
      "Test ensures all tracers are converted in forms using the .submit method.",
    test: async pg => {
      pg.forms[0].children[0].value = "zzXSSzz";
      const form = pg.forms[0];
      // Wait for the handler to set its proxy.
      while (!form.classList.contains("tracy-form-mod")) {
        await sleep(0.5);
      }
      // Grab the tracer it replaced.
      const tracers = [...form.submit()];
      // Wait while it updates the database.
      await sleep(0.2);
      const results = await Promise.all(
        tracers.map(async ({ TracerPayload: tp }) => {
          const tracer = await database.getTracerByPayload(tp);
          if (!expectEqual(!tracer, false, "tracer not defined")) {
            return false;
          }
          if (expectEqual(tracer.TracerPayload, tp, "tracer created")) {
            return true;
          }

          return false;
        })
      );
      if (results.filter(r => !r).length > 0) {
        return false;
      }

      return true;
    },
    deps: [DEPS.HOOKING, DEPS.UTIL, DEPS.DOM_MUTATIONS, DEPS.HIGHLIGHT],
    getTestTemplate: () => {
      const form = document.createElement("form");
      form.method = "GET";
      form.action = "#";
      const input = document.createElement("input");
      input.type = "text";
      input.name = "some vale";
      form.appendChild(input);

      return form;
    }
  },

  {
    name: "Form test .requestSubmit no params",
    description:
      "Test ensures all tracers are converted in forms using the .requestSubmit method. This test doesn't provide any test parameters to the requestSubmit method",
    test: async pg => {
      pg.forms[0].children[0].value = "zzXSSzz";
      const form = pg.forms[0];
      // Wait for the handler to set its proxy.
      while (!form.classList.contains("tracy-form-mod")) {
        await sleep(0.25);
      }
      // Grab the tracer it replaced.
      const tracers = [...form.requestSubmit()];
      // Wait while it updates the database.
      await sleep(0.5);
      const results = await Promise.all(
        tracers.map(async ({ TracerPayload: tp }) => {
          const tracer = await database.getTracerByPayload(tp);
          if (!expectEqual(!tracer, false, "tracer not defined")) {
            return false;
          }
          if (expectEqual(tracer.TracerPayload, tp, "tracer created")) {
            return true;
          }

          return false;
        })
      );
      if (results.filter(r => !r).length > 0) {
        return false;
      }

      return true;
    },
    deps: [DEPS.HOOKING, DEPS.UTIL, DEPS.DOM_MUTATIONS, DEPS.HIGHLIGHT],
    getTestTemplate: () => {
      const form = document.createElement("form");
      form.method = "GET";
      form.action = "#";
      const input = document.createElement("input");
      input.type = "text";
      input.name = "some vale";
      form.appendChild(input);

      return form;
    }
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
  const [tracer] = tracers;
  tracer.Severity = 0;
  tracer.HasTracerEvents = false;
  tracer.Requests = [];
  await database.addTracer(tracer);

  return [tracer.TracerString, tracer.TracerPayload];
};

const log = (text, error) => {
  const span = document.createElement("div");

  span.innerText = `[${new Date().toUTCString()}]${error ? `[ERROR]: ${text}` : `[LOG]: ${text}`
    }`;
  if (error) {
    span.style = "color:red";
  }
  document.body.appendChild(span);
};

const setupTestPlayground = (deps, template) => {
  const p = document.createElement("iframe");
  const pg = document.getElementById("playground");
  pg.appendChild(p);
  p.contentWindow.document.open();
  page = `<head>`;
  for (dep of deps) {
    page += `<script src="${dep}"></script>`;
  }
  page += `</head>`;
  page += `<body></body>`;

  const prom = new Promise(r => {
    p.onload = () => {
      p.contentWindow.document.body.appendChild(template);
      r(p.contentWindow.document);
    };
  });

  p.contentWindow.document.write(page);
  // closing the document here so the load event is called
  // at this point we know the dep scripts have been loaded
  p.contentWindow.document.close();
  // add the test template to the page

  return prom;
};

const testLifecycle = async ({
  name,
  test,
  deps = [],
  getTestTemplate = () => document.createElement("div")
}) => {
  log(`Running test [${name}]`);
  // Each test gets their own div to play around with
  const pg = await setupTestPlayground(deps, getTestTemplate());
  // At this point, the iframe is set up with whatever dependency
  // scripts it needs and any HTML nodes it needs to execute the tests.
  // Test functions are safe to manipulate the DOM however they like
  // just as a normal web page would.
  const didPass = await test(pg);
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
