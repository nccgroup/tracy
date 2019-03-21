self.addEventListener("install", e => {
  console.log("installing!", e);
});

self.addEventListener("activate", e => {
  console.log("activating!");
});

let url = "https://example.com";
self.addEventListener("message", e => {
  console.log("message", e);
  url = e.data;
});

function cleanResponse(response) {
  const clonedResponse = response.clone();

  // Not all browsers support the Response.body stream, so fall back to reading
  // the entire body into memory as a blob.
  const bodyPromise =
    "body" in clonedResponse
      ? Promise.resolve(clonedResponse.body)
      : clonedResponse.blob();

  return bodyPromise.then(body => {
    // new Response() is happy when passed either a stream or a Blob.
    return new Response(body, {
      headers: clonedResponse.headers,
      status: clonedResponse.status,
      statusText: clonedResponse.statusText
    });
  });
}

self.addEventListener("fetch", e => {
  //  debugger;
  console.log("her", e.request, url);
  if (
    e.request.method === "POST" &&
    e.request.url ===
      "chrome-extension://celbnfefjkbajjplblgkoeppibfbkagf/test.php"
  ) {
    let a = fetch(url, { redirect: "follow" })
      .then(r => {
        //  debugger;
        if (r.redirected) return cleanResponse(r);
        return r;
      })
      .catch(e => {
        //    debugger;
        console.error(e);
      });
    e.respondWith(a);
  } else if (
    !e.request.url.startsWith(
      "chrome-extension://celbnfefjkbajjplblgkoeppibfbkagf/tracy"
    )
  ) {
    let u = e.request.url;
    if (
      e.request.url.startsWith(
        "chrome-extension://celbnfefjkbajjplblgkoeppibfbkagf"
      )
    ) {
      u =
        new URL(url).origin +
        e.request.url.substring(
          "chrome-extension://celbnfefjkbajjplblgkoeppibfbkagf".length,
          e.request.url.length
        );
    }

    const meth = e.request.method.toLowerCase();
    let a;
    if (meth === "get" || meth === "head") {
      a = fetch(
        new Request(u, {
          redirect: "follow",
          method: e.request.method,
          headers: e.request.headers,
          mode: "cors",
          credentials: e.request.credentials,
          cache: e.request.cache,
          referrer: e.request.referrer,
          integrity: e.request.integrity
        })
      )
        .then(r => {
          //        debugger;
          if (r.redirected) return cleanResponse(r);
          return r;
        })
        .catch(e => {
          //      debugger;
          console.error(e);
        });
    } else {
      // Not all browsers support the Response.body stream, so fall back to reading
      // the entire body into memory as a blob.
      const bodyPromise =
        "body" in e.request
          ? Promise.resolve(e.request.body)
          : e.request.blob();

      return bodyPromise.then(body => {
        a = fetch(
          new Request(u, {
            redirect: "follow",
            method: e.request.method,
            headers: e.request.headers,
            body: body,
            mode: e.request.mode,
            credentials: e.request.credentials,
            cache: e.request.cache,
            referrer: e.request.referrer,
            integrity: e.request.integrity
          })
        )
          .then(r => {
            //        debugger;
            if (r.redirected) return cleanResponse(r);
            return r;
          })
          .catch(e => {
            //      debugger;
            console.error(e);
          });
      });
    }
    e.respondWith(a);
  }
});
