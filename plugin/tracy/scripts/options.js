// Saves options to chrome.storage
const saveOptions = () => {
  const restHost = document.getElementById("rest-host").value;
  const restPort = document.getElementById("rest-port").value;
  //  const autoFill = document.getElementById("auto-fill").checked;
  //  const autoFillPayload = document.getElementById("auto-fill-dropdown").value;
  const apiKey = document.getElementById("api-key").value;
  chrome.storage.local.set(
    {
      restHost: restHost,
      restPort: restPort,
      //    autoFill: autoFill,
      //autoFillPayload: autoFillPayload,
      apiKey: apiKey
    },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(() => {
        status.textContent = "";
      }, 750);
    }
  );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = async () => {
  const settings = await new Promise(r =>
    chrome.storage.local.get(
      {
        restHost: "127.0.0.1",
        restPort: 7777,
        //      autoFill: false,
        //        autoFillPayload: "GEN-XSS",
        apiKey: ""
      },
      settings => r(settings)
    )
  );

  /*  const s = document.getElementById("auto-fill-dropdown");
  replace.getTracerTypes().map(i => {
    const o = document.createElement("option");
    o.text = i[0];
    s.add(o);
  });*/

  //  document.getElementById("auto-fill-dropdown").value =    settings.autoFillPayload;
  document.getElementById("rest-host").value = settings.restHost;
  document.getElementById("rest-port").value = settings.restPort;
  //  document.getElementById("auto-fill").checked = settings.autoFill;
  document.getElementById("api-key").value = settings.apiKey;
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("save").addEventListener("click", saveOptions);
  /*  document.getElementById("auto-fill").addEventListener("click", e => {
    document.getElementById("auto-fill-dropdown");
  });*/
  restoreOptions();
});
