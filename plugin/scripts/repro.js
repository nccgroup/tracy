(function() {
  const elems = document.querySelectorAll("[onfocus]");
  for (let i = 0; i < elems.length; i++) {
    elems[i].onfocus();
  }
})();
