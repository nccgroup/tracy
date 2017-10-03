(function() {
//document.body.innerHTML = "<div id='hello' lol='test'><a src='waldo'>hello</a></div><div id='demo'></div>";

  urlParameterJavaScriptXSS();
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      //document.getElementById("demo").innerHTML = this.responseText;
    }
  };
  xhttp.open("GET", "example.html", true);
  xhttp.send();

})();


function urlParameterJavaScriptXSS(){
  var url = new URL(document.location.href);
  var echoParm = url.searchParams.get("echo");

  document.getElementById("urlParameterJavaScriptXSS").innerHTML = echoParm;
}
