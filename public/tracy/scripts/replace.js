// the replace package is used for replacing strings, headers,
// and bodies of HTTP requests with tracer strings.
const replace = (() => {
  // tracerSwap is the string that is used to represent where
  // in a tracer type a random tracer ID should be replaced.
  const tracerSwap = "[[ID]]";

  // getTracerTypes returns the set of available tracers
  // that need to be replaced  inline before an HTTP request
  // is sent off.
  // TODO: use the settings.js for this. need to find a way to
  // get the settings from an injectable script
  const getTracerTypes = () => [
    ["zzXSSzz", `\\"'<${tracerSwap}>`],
    ["GEN-XSS", `\\"'<${tracerSwap}>`],
    ["GEN-PLAIN", `${tracerSwap}`],
    ["zzPLAINzz", `${tracerSwap}`]
  ];

  // str replaces any tracer types with their corresponding
  // tracer strings. Returns the replaced string as well
  // as an array of tracers that were replaced and their tracer type.
  const str = msg => {
    if (!msg) return { str: msg, tracers: [] };
    if (typeof msg !== "string") return { str: msg, tracers: [] };
    let copy = msg;
    const tracers = [];
    const tracerTypes = getTracerTypes();
    for (let i in tracerTypes) {
      const tracerType = tracerTypes[i];

      // Only do replacements if there is a tracer type in the message.
      if (msg.indexOf(tracerType[0]) === -1) {
        continue;
      }

      // If there is, do the first replacement.
      let gen = genTracer();
      let copyr = copy.replace(
        tracerType[0],
        tracerType[1].replace(tracerSwap, gen)
      );
      tracers.push({ TracerString: tracerType[0], TracerPayload: gen });

      // Continue to do replacements until we get the same string.
      for (;;) {
        gen = genTracer();
        copy = copyr;
        copyr = copy.replace(
          tracerType[0],
          tracerType[1].replace(tracerSwap, gen)
        );
        // if the strings are the same, there is no more replacements
        if (copyr === copy) {
          break;
        } else {
          tracers.push({ TracerString: tracerType[0], TracerPayload: gen });
        }
      }
    }
    return { str: copy, tracers: tracers };
  };

  // genTracer generates a random 10 letter unique ID that serves as a
  // tracer.
  const genTracer = () => {
    const len = 10;
    const randAlpha = length => {
      let text = "";
      const possible = "abcdefghijklmnopqrstuvwxyz";

      for (let i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
    };

    return randAlpha(len);
  };

  // headers replaces strings in a Headers object and rebuilds it
  // into a new Header object.
  const headers = headers => {
    if (!headers) {
      return headers;
    }

    let tracers = [],
      copy = new Headers();
    if (!(headers instanceof Headers)) {
      headers = new Headers(headers);
    }
    let key, value;
    for (let i of headers) {
      key = str(i[0]);
      value = str(i[1]);
      tracers = tracers.concat(key.tracers.concat(value.tracers));
      copy.append(key.str, value.str);
    }

    return { headers: copy, tracers: tracers };
  };

  // body takes any one of the JavaScript body interfaces
  // and replaces the contents using str, then rebuilds
  // the data back into the same interface. See
  // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
  // for more info about the body types.
  // We don't use the body mixins from the Request object because we want to
  // keep the original body types.
  const body = async body => {
    if (body instanceof Blob) {
      //TODO: maybe we shouldn't support blobs of data?
      return await replaceBlob(body);
    } else if (body instanceof ArrayBuffer) {
      return replaceBufferSource(body);
    } else if (body instanceof FormData) {
      return replaceFormData(body);
    } else if (body instanceof URLSearchParams) {
      return replaceURLSearchParams(body);
    }

    // If it is none of the above types, it is probably just a plain string.
    const b = str(body);
    return { body: b.str, tracers: b.tracers };
  };

  // replaceURLSearchParams replaces each key and value of a URLSearchParams
  // object with tracer strings and rebuilds a URLSearchParams object.
  const replaceURLSearchParams = usp => {
    const copy = new URLSearchParams();
    let key,
      value,
      tracers = [];
    for (let i of usp.entries()) {
      key = str(i[0]);
      value = str(i[1]);
      tracers = tracers.concat(key.tracers.concat(value.tracers));
      copy.append(key.str, value.str);
    }
    return { body: copy, tracers: tracers };
  };

  // replaceFormData replaces each key and value of a FormData
  // object with tracer strings and rebuilds a FormData object.
  const replaceFormData = form => {
    const copy = new FormData();
    let key,
      value,
      tracers = [];
    for (let i of form.entries()) {
      key = str(i[0]);
      value = str(i[1]);
      tracers = tracers.concat(key.tracers.concat(value.tracers));
      copy.append(key.str, value.str);
    }

    return { body: copy, tracers: tracers };
  };

  // replaceBlob replaces the blob type with tracer strings and rebuilds a
  // blob.
  const replaceBlob = blob => {
    const reader = new FileReader();
    return new Promise(r => {
      reader.addEventListener("loadend", e => {
        ({ str, tracers } = str(e.srcElement.result));
        r({
          body: new Blob([str], {
            type: blob.type
          }),
          tracers: tracers
        });
      });
      reader.readAsText(blob);
    });
  };

  // Helper functions for replaceBufferSource
  const ab2str = buf => String.fromCharCode.apply(null, new Uint8Array(buf));
  const str2ab = str => {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  };
  // replaceBufferSource replaces the given buffer source with tracer strings
  // and rebuilds the buffer.
  const replaceBufferSource = bs => {
    const b = str(ab2str(bs));
    return { body: str2ab(b.str), tracers: b.tracers };
  };

  return { str: str, body: body, headers: headers };
})();
