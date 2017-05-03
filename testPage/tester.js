(function() {
document.body.innerHTML = "<div id='hello' lol='test'><a src='waldo'>hello</a></div><div id='demo'></div>";


  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("demo").innerHTML = this.responseText;
    }
  };
  xhttp.open("GET", "example.html", true);
  xhttp.send();

})();
