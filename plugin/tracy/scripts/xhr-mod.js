(() => {
  XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
    apply: (t, thisa, al) => {
      if (al.length === 0) return Reflect.apply(t, thisa, al);
      replace.body(al[0]).then(body => Reflect.apply(t, thisa, [body]));
    }
  });

  XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
    apply: (t, thisa, al) => {
      if (al.length !== 2) return Reflect.apply(t, thisa, al);
      al[1] = replace.str(al[1]);
      return Reflect.apply(t, thisa, al);
    }
  });

  XMLHttpRequest.prototype.setRequestHeader = new Proxy(
    XMLHttpRequest.prototype.setRequestHeader,
    {
      apply: (t, thisa, al) => {
        if (al.length !== 2) return Reflect.apply(t, thisa, al);
        return Reflect.apply(t, thisa, [
          replace.str(al[0]),
          replace.str(al[1])
        ]);
      }
    }
  );
})();
