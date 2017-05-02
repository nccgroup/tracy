
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    var data = message.data;
      xss.forEach(function(tracer){
        if(data.msg.indexOf(tracer)!=-1){
          console.log("tracer: " + data.msg);
        }
      });
  });
