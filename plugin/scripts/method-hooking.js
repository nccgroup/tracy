eval = new Proxy(eval, {
  apply: (target, thisArg, argumentsList) => {
    window.postMessage({'type': 'eval', 'msg': argumentsList.join(',')}, "*");//I wish i could just send location here but it broke for some reason
    return Reflect.apply(target, thisArg, argumentsList);
  }
});

setTimeout = new Proxy(setTimeout, {
  apply: (target, thisArg, argumentsList) => {
    window.postMessage({'type': 'setTimeout', 'msg': argumentsList.join(',')}, "*");
    return Reflect.apply(target, thisArg, argumentsList);
  }
});

Function = new Proxy(Function, {
  apply: (target, thisArg, argumentsList) => {
    window.postMessage({'type': 'function', 'msg': argumentsList.join(',')}, "*");
    return Reflect.apply(target, thisArg, argumentsList);
  }
});
