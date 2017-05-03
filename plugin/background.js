var xss = ["OQ1Cd2", "Waldo"]

chrome.runtime.onMessageExternal.addListener(requestHandler);
chrome.runtime.onMessage.addListener(requestHandler);


function requestHandler(request, sender, sendResponse) {
  xss.forEach(function(tracer){
    if(request.msg.indexOf(tracer)!=-1){
      console.log("tracerHit: " + request.msg + " Type: " + request.type);
    }
  });
}
