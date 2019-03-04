// Saves options to chrome.storage
function saveOptions() {
  const restHost = document.getElementById("rest-host").value;
  const restPort = document.getElementById("rest-port").value;
  const autoFill = document.getElementById("auto-fill").checked;
  const autoFillPayload = document.getElementById("auto-fill-dropdown").value;
  chrome.storage.local.set(
    {
      restHost: restHost,
      restPort: restPort,
      autoFill: autoFill,
      autoFillPayload: autoFillPayload
    },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(function() {
        status.textContent = "";
      }, 750);
    }
  );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = async () => {
  const settings = await new Promise(r =>
    chrome.storage.local.get(
      {
        restHost: "127.0.0.1",
        restPort: 7777,
        autoFill: false,
        autoFillPayload: "GEN-XSS"
      },
      settings => r(settings)
    )
  );
  const disabled = await new Promise(r =>
    chrome.runtime.sendMessage(
      {
        "message-type": "config",
        config: "disabled"
      },
      disabled => r(disabled)
    )
  );

  if (!disabled) {
    try {
      const resJSON = await fetch(
        `http://${settings.restHost}:${settings.restPort}/api/tracy/config`,
        {
          headers: { Hoot: "!" }
        }
      );
      const s = document.getElementById("auto-fill-dropdown");
      const res = await resJSON.json();
      Object.keys(res["TracerStrings"]).forEach(i => {
        const o = document.createElement("option");
        o.text = i;
        s.add(o);
      });
    } catch (err) {
      console.error(err);
      return;
    }
  }

  document.getElementById("auto-fill-dropdown").value =
    settings.autoFillPayload;
  document.getElementById("rest-host").value = settings.restHost;
  document.getElementById("rest-port").value = settings.restPort;
  document.getElementById("auto-fill").checked = settings.autoFill;
};

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("save").addEventListener("click", saveOptions);
  document.getElementById("auto-fill").addEventListener("click", e => {
    document.getElementById("auto-fill-dropdown");
  });
  await restoreOptions();
});
