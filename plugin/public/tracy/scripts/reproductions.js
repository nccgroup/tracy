const reproductions = (() => {
  /// prepCache uses a tab to recreate the state of a page with a
  // special header attached so that tracy knows on the backend to
  // cache the responses in-memory so that we can run reproductions
  // without changing the state of the application.
  const prepCache = event => {
    // Prep the cache by making a request through the proxy with the
    // SET-CACHE header. Tracy will keep these responses in memory for
    // the rest of our reproduction steps.
    chrome.tabs.create({ active: false }, tab => {
      const beforeHandler = details => {
        return {
          requestHeaders: details.requestHeaders.concat({
            name: "X-TRACY",
            value: "SET-CACHE"
          })
        };
      };

      // Requests that come from this tab ID should be proxied
      // and have the special header `SET-CACHE` added to it.
      chrome.webRequest.onBeforeSendHeaders.addListener(
        beforeHandler,
        { urls: ["<all_urls>"], tabId: tab.id },
        ["blocking", "requestHeaders"]
      );

      // After the page is finished loading, close the tab.
      chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === "complete") {
          removeTab(tab.id);
        }
      });

      // Store the tab so that we can prevent the MutationObserver from triggering
      // during the reproduction steps flows.
      memoTabs.add(tab.id, {
        event: event
      });

      // Clear the browser cache before we prep so that we don't
      // get in a weird situation where we open a tab and some resources
      // were cached by the browser, but when we go to reproduce
      // they aren't in our cache.
      chrome.browsingData.removeCache({});

      // Change the URL of the blank page after all the callbacks are properly
      // set up so that we can capture all the requests.
      chrome.tabs.update(tab.id, { url: event.EventURL });
    });
  };

  // reproduceFinding takes a tracer and event and attempts to reproduce
  // the finding with a valid XSS payload. If done successfully, this
  // background page should be able to inject a script to read a predictable
  // value from the page. Reproduction are completed using the
  // in-memory cache of responses from this event.
  const reproduceFinding = (tracer, event, context, repros) => {
    // For each of the reproduction steps, spin up a tab to
    // test the different exploits.
    repros.map(repro => {
      // After the cache has been prepped, send the exploits.
      chrome.tabs.create({ active: false }, tab => {
        const callback = details => {
          return {
            requestHeaders: details.requestHeaders.concat({
              name: "X-TRACY",
              value:
                "GET-CACHE;" + btoa(repro.Exploit + "--" + tracer.TracerPayload)
            })
          };
        };

        // Requests that come from this tab ID should be proxied
        // and have the special header `GET-CACHE` added to it,
        // along with the data the extension wants to have swapped out
        // on the server.
        chrome.webRequest.onBeforeSendHeaders.addListener(
          callback,
          { urls: ["<all_urls>"], tabId: tab.id },
          ["blocking", "requestHeaders"]
        );

        // After the page is finished loading, close the tab.
        chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
          if (tabId === tab.id && changeInfo.status === "complete") {
            // We can probably remove this timeout once we learn more about
            // the average time it takes to fire a payload after the page has
            // completed.
            removeTab(tab.id);
          }
        });

        memoTabs.add(tab.id, {
          tracer: tracer,
          event: event,
          context: context,
          repro: repro,
          callback: callback
        });

        chrome.tabs.update(tab.id, { url: event.EventURL });
      });
    });
  };

  // tabs keeps a running tally of the currently tested tabs
  // that are being opened and closed for reproduction steps.
  const tabs = () => {
    let tabs = {};
    return {
      get: () => tabs,
      add: (t, args) => (tabs[`${t}`] = args),
      del: t => delete tabs[`${t}`]
    };
  };
  const memoTabs = tabs();
  // updateReproduction validates that a particular tab
  // executed a Javascript payload correctly.
  const updateReproduction = (message, sender) => {
    const tab = memoTabs.get()[sender.tab.id];
    if (!tab) {
      return;
    }
    const reproTest = { Successful: true };

    if (!disabled) {
      fetch(
        `http://${restServer}/api/tracy/tracers/${tab.tracer.ID}/events/${
          tab.context.ID
        }/reproductions/${tab.repro.ID}`,
        {
          method: "PUT",
          body: JSON.stringify(reproTest),
          headers: { Hoot: "!" }
        }
      ).catch(err => console.error(err));
    }

    removeTab(sender.tab.id);
  };

  // removeTab removes the tab from the browser and also removes the
  // tab from list of currently available tabs that are cached.
  const removeTab = id => {
    // Close the tab when we are done with it.
    chrome.tabs.remove(id);
    // Remove the tab from the list of collected tabs.
    memoTabs.del(id);
  };

  return {
    reproduceFinding: reproduceFinding,
    updateReproduction: updateReproduction,
    prepCache: prepCache,
    tabs: memoTabs
  };
})();
