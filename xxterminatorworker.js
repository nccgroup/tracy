var xss = ["XSS", "Waldo"]

self.addEventListener('message', function(message) {
  var data = message.data;
    xss.forEach(function(tracer){
      if(data.msg.indexOf(tracer)!=-1){
        console.log("tracer: " + data.msg);
      }
    });
}, false);
