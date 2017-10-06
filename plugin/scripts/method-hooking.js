eval = new Proxy(eval, {
  apply: function(target, thisArg, argumentsList) {
    window.postMessage({'type': 'eval', 'msg': argumentsList.join(',')}, "*");//I wish i could just send location here but it broke for some reason
    return target.apply(thisArg, argumentsList);
  }
});

setTimeout = new Proxy(setTimeout, {
  apply: function(target, thisArg, argumentsList) {
    window.postMessage({'type': 'setTimeout', 'msg': argumentsList.join(',')}, "*");
    return target.apply(thisArg, argumentsList);
  }
});

Function = new Proxy(Function, {
  apply: function(target, thisArg, argumentsList) {
    window.postMessage({'type': 'function', 'msg': argumentsList.join(',')}, "*");
    return target.apply(thisArg, argumentsList);
  }
});
