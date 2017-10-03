var tracerList = ["OQ1Cd2", "Waldo"]

chrome.runtime.onMessageExternal.addListener(requestHandler);
chrome.runtime.onMessage.addListener(requestHandler);

function requestHandler(request, sender, sendResponse) {
  tracerList.forEach(function(tracer){
    if(request.msg.indexOf(tracer)!=-1){ // This only find the first case. Is that good enough.
      console.log("tracerHit: " + request.msg + " Type: " + request.type);
      var event = {"ID":tracer,"Data":request.msg,"Location":"example.com/test","EventType":request.type}

      var xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:8081/tracer/hit", true);//should this be async?
      xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
      xhr.send(JSON.stringify(event));
    }
  });
}

chrome.browserAction.onClicked.addListener(function(tab) {
  var xhr = new XMLHttpRequest();

  xhr.open("GET", "http://localhost:8081/tracer/list", false);//should this be async?
  xhr.send();

  tracerList = JSON.parse(xhr.responseText);
});

//{"ID":"test","Data":"hello","Location":"example.com/test","EventType":"DOM"}
