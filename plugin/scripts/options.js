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
function restoreOptions() {
  chrome.storage.local.get(
    {
      restHost: "127.0.0.1",
      restPort: 7777,
      autoFill: false,
      autoFillPayload: "GEN-XSS"
    },
    settings => {
      const s = document.getElementById("auto-fill-dropdown");
      fetch(`http://${settings.restHost}:${settings.restPort}/config`, {
        headers: { Hoot: "!" }
      })
        .then(res => res.json())
        .catch(err => console.error(err))
        .then(res => {
          Object.keys(res["tracers"]).forEach(i => {
            const o = document.createElement("option");
            o.text = i;
            s.add(o);
          });

          console.log("[PAYLOAD]", settings);
          document.getElementById("auto-fill-dropdown").value =
            settings.autoFillPayload;
        });

      document.getElementById("rest-host").value = settings.restHost;
      document.getElementById("rest-port").value = settings.restPort;
      document.getElementById("auto-fill").checked = settings.autoFill;
      s.disabled = !settings.autoFill;
    }
  );
}
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("save").addEventListener("click", saveOptions);
  document.getElementById("auto-fill").addEventListener("click", e => {
    const t = document.getElementById("auto-fill-dropdown");
    t.disabled = !t.disabled;
  });
  restoreOptions();
});
