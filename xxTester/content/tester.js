document.addEventListener("DOMContentLoaded", function(event) {
  var payload = null;
  var req = new Request('/echo', {method: 'POST', body: '{{XSS}}'})

  fetch(req).then(function(resp) {
    if(resp.status == 200){
      resp.text().then(function(text){
          payload = text.split("<")[1].split(">")[0]//This seems like a hack but it works for now

          textPayload(text)
          attr(text)
          evalPayload(text)
          timeoutPayload(text)
          setTimeout(function(){
            var eventReq = new Request('http://localhost:8081/tracers/events', {method: 'GET'})
            fetch(eventReq).then(eventRequest)
          }, 2500)
      })
    }
    else throw new Error('I think I broke something....');

  }).catch(function(error) {
    console.error(error)
  })

  function eventRequest(resp){
    resp.json().then(function(data){
      console.log(payload);
      console.log(data);

      var filteredData = data.filter((n) => n.TracerString === payload)[0];
      var node = document.querySelector("#results");

      filteredData.Events.forEach(function(event){
          event.Contexts.forEach(function(context){
            var result = document.createTextNode(`Found Event in ${context.NodeName} with context type of ${context.Location}`)
            var br = document.createElement("br");
            node.appendChild(result)
            node.appendChild(br)
          })
      })
      var result = document.createTextNode(`Found ${filteredData.Events.length} out of 5`)
      node.appendChild(result)
    })
  }

  function textPayload(payload) {
    var output = document.querySelector("#text")
    output.innerHTML = payload
  }

  function attr(payload) {
    var output = document.querySelector("#attr")
    output.innerHTML = '<a href="' + payload + '" >test</a>'
  }

  function evalPayload(payload) {
    try {
        eval('"eval test" + "' + payload + '"')
    } catch(e){
      console.log(e);
    }
  }

  function timeoutPayload(payload) {
    try {
      setTimeout('"setTimeout test" + "' + payload + '"', 10)
    } catch(e) {
      console.log(e);
    }
  }

});
