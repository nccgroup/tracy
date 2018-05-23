// Saves options to chrome.storage
function saveOptions() {
  let restHost = document.getElementById("rest-host").value;
  let restPort = document.getElementById("rest-port").value;
  chrome.storage.local.set(
    {
      restHost: restHost,
      restPort: restPort
    },
    function() {
      // Update status to let user know options were saved.
      let status = document.getElementById("status");
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
      restHost: "localhost",
      restPort: 8081
    },
    function(res) {
      document.getElementById("rest-host").value = res.restHost;
      document.getElementById("rest-port").value = res.restPort;
    }
  );
}
document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
