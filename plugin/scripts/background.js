var tracerList = []

function refreshTracerList() {
  var xhr = new XMLHttpRequest();

  xhr.open("GET", "http://localhost:8081/tracers", false);//should this be async?
  xhr.send();

  tracerList = JSON.parse(xhr.responseText);
}

function requestHandler(request, sender, sendResponse) {
  refreshTracerList()
  for(var tracerKey in tracerList) {
    var tracerString = tracerList[tracerKey]["TracerString"];
    if(request.msg.indexOf(tracerString)!=-1 ){ // This only find the first case. Is that good enough.
      var event = {
        "Data": request.msg,
        "Location": request.location.href,
        "EventType":request.type
      };

      var xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:8081/tracers/" + tracerList[tracerKey]["ID"] + "/events", true);//should this be async?
      xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
      xhr.send(JSON.stringify(event));
    }
  }
}

chrome.runtime.onMessageExternal.addListener(requestHandler);
chrome.runtime.onMessage.addListener(requestHandler);
chrome.browserAction.onClicked.addListener(refreshTracerList());

