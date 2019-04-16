(() => {
  //TODO: capture all headers here and update the raw requests of tracers
  // to have more accurate HTTP requests.
  chrome.webRequest.onBeforeRequest.addListener(
    r => {
      const url = new URL(r.url);
      const copy = new URLSearchParams();
      let mod = false;
      let tracers = [];
      url.searchParams.forEach((value, key) => {
        const keyr = replace.str(key);
        const valuer = replace.str(value);

        if (keyr.tracers.length !== 0 || valuer.tracers.length !== 0) {
          tracers = tracers.concat(keyr.tracers).concat(valuer.tracers);
          mod = true;
        }
        copy.append(keyr.str, valuer.str);
      });

      // Not a fan of doing this, but luckily this only happens when you click
      // a link that has a zzPLAINzz or zzXSSzz in it, which I imagine won't be the usual
      // case. We could try to hook link clicks like how we hook onsubmit with forms.
      // This is also used for navigation through document.location, which I am pretty
      // sure is un-hookable. I keep getting the following error:
      // TypeError: can't redefine non-configurable property "location"
      // Looks like this also happens for img requests and the like (pixel trackers and other
      // things that make outbound requests)
      if (mod) {
        url.search = copy.toString();
        const newURL = url.toString();

        // These are only handling link clicks, so there shouldn't be any body
        background.fetch(
          {
            route: "/api/tracy/tracers",
            method: "POST",
            body: JSON.stringify({
              RawRequest: `${r.method} ${url.pathname}${url.search}  HTTP/1.1
Host: ${url.host}`,
              RequestURL: newURL,
              RequestMethod: r.method,
              Tracers: tracers
            })
          },
          null,
          () => {}
        );

        console.log("[REDIRECTING]", r.url, newURL);
        return { redirectUrl: newURL };
      }
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
  );
})();
