// the replace package is used for replacing strings, headers,
// and bodies of HTTP requests with tracer strings.
const replace = (() => {
  let cachedTracers = [];
  // getTracerTypes returns the set of available tracers
  // that need to be replaced  inline before an HTTP request
  // is sent off.
  const getTracerTypes = async pageType => {
    switch (pageType) {
      case ScriptContexts.PAGE:
      case ScriptContexts.CONTENT:
        return await channel.send(MessageTypes.TracerStrings);
      case ScriptContexts.BACKGROUND:
        return await settings.getTracerStrings();
      default:
        return DefaultTracerTypes;
    }
  };

  (async () => {
    cachedTracers = await getTracerTypes(CurrentPageType);
    setInterval(
      async () => (cachedTracers = await getTracerTypes(CurrentPageType)),
      5000
    );
  })();

  // str replaces any tracer types with their corresponding
  // tracer strings. Returns the replaced string as well
  // as an array of tracers that were replaced and their tracer type.
  const str = msg => {
    if (!msg) {
      return { str: msg, tracers: [] };
    }
    if (typeof msg !== "string") {
      return { str: msg, tracers: [] };
    }

    return cachedTracers.reduce(
      ({ tracers, str }, [tracerString, tracerPayload]) => {
        const splits = str.split(tracerString);
        if (splits.length === 1) {
          return { tracers, str };
        }

        const last = splits.pop();

        const [addedTracers, replacedStr] = splits.reduce(
          ([addedTracers, replacedStr], split) => {
            const gen = genTracer();
            return [
              [
                ...addedTracers,
                { TracerString: tracerString, TracerPayload: gen }
              ],
              replacedStr +
                split +
                tracerPayload.replace(Strings.TRACER_SWAP, gen)
            ];
          },
          [tracers, ""]
        );
        return {
          tracers: [...tracers, ...addedTracers],
          str: replacedStr + last
        };
      },
      { tracers: [], str: msg }
    );
  };

  // genTracer generates a random 10 letter unique ID that serves as a
  // tracer.
  const genTracer = () => {
    const len = 10;
    const randAlpha = length => {
      let text = "";

      for (let i = 0; i < length; i++)
        text += Strings.ALPHA.charAt(
          Math.floor(Math.random() * Strings.ALPHA.length)
        );

      return text;
    };

    return randAlpha(len);
  };

  // headers replaces strings in a Headers object and rebuilds it
  // into a new Header object.
  const headers = headers =>
    replaceIterabletype(new Headers(headers), new Headers(), "headers");

  // body takes any one of the JavaScript body interfaces
  // and replaces the contents using str, then rebuilds
  // the data back into the same interface. See
  // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
  // for more info about the body types.
  // We don't use the body mixins from the Request object because we want to
  // keep the original body types.
  const body = body => {
    if (body instanceof Blob) {
      // Stringifying this data wasn't really working well and was messing up
      // the data. Since the data here is in a binary format, I don't really
      // want to corrupt and data otherwise web browsing experience will be bad.
      return { body: body, tracers: [] };
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
  const replaceURLSearchParams = usp =>
    replaceIterabletype(usp, new URLSearchParams(), "body");

  // replaceFormData replaces each key and value of a FormData
  // object with tracer strings and rebuilds a FormData object.
  const replaceFormData = form =>
    replaceIterabletype(form, new FormData(), "body");
  const replaceIterabletype = (iter, iterType, strType) => {
    [...iter].reduce(
      ({ [strType]: str, tracers }, [key, value]) => {
        const { tracers: ktracers, str: kstr } = str(key);
        const { tracers: vtracers, str: vstr } = str(value);
        str.append(kstr, vstr);
        return {
          [strType]: str,
          tracers: [...tracers, ...ktracers, ...vtracers]
        };
      },
      { [strType]: iterType, tracers: [] }
    );
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

  return {
    str: str,
    body: body,
    headers: headers,
    getTracerPayloads: () => cachedTracers
  };
})();
