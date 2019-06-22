var PathLoader =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./index.js":
/*!******************!*\
  !*** ./index.js ***!
  \******************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Jeremy Whitlock
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var supportedLoaders = {
  file: __webpack_require__(/*! ./lib/loaders/file */ "./lib/loaders/file-browser.js"),
  http: __webpack_require__(/*! ./lib/loaders/http */ "./lib/loaders/http.js"),
  https: __webpack_require__(/*! ./lib/loaders/http */ "./lib/loaders/http.js")
};
var defaultLoader = (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' || typeof importScripts === 'function' ? supportedLoaders.http : supportedLoaders.file;

// Load promises polyfill if necessary
/* istanbul ignore if */
if (typeof Promise === 'undefined') {
  __webpack_require__(/*! native-promise-only */ "./node_modules/native-promise-only/lib/npo.src.js");
}

function getScheme(location) {
  if (typeof location !== 'undefined') {
    location = location.indexOf('://') === -1 ? '' : location.split('://')[0];
  }

  return location;
}

/**
 * Utility that provides a single API for loading the content of a path/URL.
 *
 * @module path-loader
 */

function getLoader(location) {
  var scheme = getScheme(location);
  var loader = supportedLoaders[scheme];

  if (typeof loader === 'undefined') {
    if (scheme === '') {
      loader = defaultLoader;
    } else {
      throw new Error('Unsupported scheme: ' + scheme);
    }
  }

  return loader;
}

/**
 * Loads a document at the provided location and returns a JavaScript object representation.
 *
 * @param {string} location - The location to the document
 * @param {module:path-loader.LoadOptions} [options] - The loader options
 *
 * @returns {Promise<*>} Always returns a promise even if there is a callback provided
 *
 * @example
 * // Example using Promises
 *
 * PathLoader
 *   .load('./package.json')
 *   .then(JSON.parse)
 *   .then(function (document) {
 *     console.log(document.name + ' (' + document.version + '): ' + document.description);
 *   }, function (err) {
 *     console.error(err.stack);
 *   });
 *
 * @example
 * // Example using options.prepareRequest to provide authentication details for a remotely secure URL
 *
 * PathLoader
 *   .load('https://api.github.com/repos/whitlockjc/path-loader', {
 *     prepareRequest: function (req, callback) {
 *       req.auth('my-username', 'my-password');
 *       callback(undefined, req);
 *     }
 *   })
 *   .then(JSON.parse)
 *   .then(function (document) {
 *     console.log(document.full_name + ': ' + document.description);
 *   }, function (err) {
 *     console.error(err.stack);
 *   });
 *
 * @example
 * // Example loading a YAML file
 *
 * PathLoader
 *   .load('/Users/not-you/projects/path-loader/.travis.yml')
 *   .then(YAML.safeLoad)
 *   .then(function (document) {
 *     console.log('path-loader uses the', document.language, 'language.');
 *   }, function (err) {
 *     console.error(err.stack);
 *   });
 *
 * @example
 * // Example loading a YAML file with options.processContent (Useful if you need information in the raw response)
 *
 * PathLoader
 *   .load('/Users/not-you/projects/path-loader/.travis.yml', {
 *     processContent: function (res, callback) {
 *       callback(YAML.safeLoad(res.text));
 *     }
 *   })
 *   .then(function (document) {
 *     console.log('path-loader uses the', document.language, 'language.');
 *   }, function (err) {
 *     console.error(err.stack);
 *   });
 */
module.exports.load = function (location, options) {
  var allTasks = Promise.resolve();

  // Default options to empty object
  if (typeof options === 'undefined') {
    options = {};
  }

  // Validate arguments
  allTasks = allTasks.then(function () {
    if (typeof location === 'undefined') {
      throw new TypeError('location is required');
    } else if (typeof location !== 'string') {
      throw new TypeError('location must be a string');
    }

    if (typeof options !== 'undefined') {
      if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object') {
        throw new TypeError('options must be an object');
      } else if (typeof options.processContent !== 'undefined' && typeof options.processContent !== 'function') {
        throw new TypeError('options.processContent must be a function');
      }
    }
  });

  // Load the document from the provided location and process it
  allTasks = allTasks.then(function () {
    return new Promise(function (resolve, reject) {
      var loader = getLoader(location);

      loader.load(location, options || {}, function (err, document) {
        if (err) {
          reject(err);
        } else {
          resolve(document);
        }
      });
    });
  }).then(function (res) {
    if (options.processContent) {
      return new Promise(function (resolve, reject) {
        // For consistency between file and http, always send an object with a 'text' property containing the raw
        // string value being processed.
        options.processContent((typeof res === 'undefined' ? 'undefined' : _typeof(res)) === 'object' ? res : { text: res }, function (err, processed) {
          if (err) {
            reject(err);
          } else {
            resolve(processed);
          }
        });
      });
    } else {
      // If there was no content processor, we will assume that for all objects that it is a Superagent response
      // and will return its `text` property value.  Otherwise, we will return the raw response.
      return (typeof res === 'undefined' ? 'undefined' : _typeof(res)) === 'object' ? res.text : res;
    }
  });

  return allTasks;
};

/***/ }),

/***/ "./lib/loaders/file-browser.js":
/*!*************************************!*\
  !*** ./lib/loaders/file-browser.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Jeremy Whitlock
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */



var unsupportedError = new TypeError('The \'file\' scheme is not supported in the browser');

/**
 * The file loader is not supported in the browser.
 *
 * @throws {error} the file loader is not supported in the browser
 */
module.exports.getBase = function () {
  throw unsupportedError;
};

/**
 * The file loader is not supported in the browser.
 */
module.exports.load = function () {
  var fn = arguments[arguments.length - 1];

  if (typeof fn === 'function') {
    fn(unsupportedError);
  } else {
    throw unsupportedError;
  }
};

/***/ }),

/***/ "./lib/loaders/http.js":
/*!*****************************!*\
  !*** ./lib/loaders/http.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/* eslint-env node, browser */

/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Jeremy Whitlock
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */



var request = __webpack_require__(/*! superagent */ "./node_modules/superagent/lib/client.js");

var supportedHttpMethods = ['delete', 'get', 'head', 'patch', 'post', 'put'];

/**
 * Loads a file from an http or https URL.
 *
 * @param {string} location - The document URL (If relative, location is relative to window.location.origin).
 * @param {object} options - The loader options
 * @param {string} [options.method=get] - The HTTP method to use for the request
 * @param {module:PathLoader~PrepareRequestCallback} [options.prepareRequest] - The callback used to prepare a request
 * @param {module:PathLoader~ProcessResponseCallback} [options.processContent] - The callback used to process the
 * response
 * @param {function} callback - The error-first callback
 */
module.exports.load = function (location, options, callback) {
  var realMethod = options.method ? options.method.toLowerCase() : 'get';
  var err;
  var realRequest;

  function makeRequest(err, req) {
    if (err) {
      callback(err);
    } else {
      // buffer() is only available in Node.js
      if (Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]' && typeof req.buffer === 'function') {
        req.buffer(true);
      }

      req.end(function (err2, res) {
        if (err2) {
          callback(err2);
        } else {
          callback(undefined, res);
        }
      });
    }
  }

  if (typeof options.method !== 'undefined') {
    if (typeof options.method !== 'string') {
      err = new TypeError('options.method must be a string');
    } else if (supportedHttpMethods.indexOf(options.method) === -1) {
      err = new TypeError('options.method must be one of the following: ' + supportedHttpMethods.slice(0, supportedHttpMethods.length - 1).join(', ') + ' or ' + supportedHttpMethods[supportedHttpMethods.length - 1]);
    }
  } else if (typeof options.prepareRequest !== 'undefined' && typeof options.prepareRequest !== 'function') {
    err = new TypeError('options.prepareRequest must be a function');
  }

  if (!err) {
    realRequest = request[realMethod === 'delete' ? 'del' : realMethod](location);

    if (options.prepareRequest) {
      try {
        options.prepareRequest(realRequest, makeRequest);
      } catch (err2) {
        callback(err2);
      }
    } else {
      makeRequest(undefined, realRequest);
    }
  } else {
    callback(err);
  }
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../node_modules/process/browser.js */ "./node_modules/process/browser.js")))

/***/ }),

/***/ "./node_modules/component-emitter/index.js":
/*!*************************************************!*\
  !*** ./node_modules/component-emitter/index.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Expose `Emitter`.
 */

if (true) {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function (event, fn) {
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function (event) {
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1),
      callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function (event) {
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function (event) {
  return !!this.listeners(event).length;
};

/***/ }),

/***/ "./node_modules/native-promise-only/lib/npo.src.js":
/*!*********************************************************!*\
  !*** ./node_modules/native-promise-only/lib/npo.src.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, setImmediate) {var __WEBPACK_AMD_DEFINE_RESULT__;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*! Native Promise Only
    v0.8.1 (c) Kyle Simpson
    MIT License: http://getify.mit-license.org
*/

(function UMD(name, context, definition) {
	// special form of UMD for polyfilling across evironments
	context[name] = context[name] || definition();
	if ( true && module.exports) {
		module.exports = context[name];
	} else if (true) {
		!(__WEBPACK_AMD_DEFINE_RESULT__ = (function $AMD$() {
			return context[name];
		}).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}
})("Promise", typeof global != "undefined" ? global : undefined, function DEF() {
	/*jshint validthis:true */
	"use strict";

	var builtInProp,
	    cycle,
	    scheduling_queue,
	    ToString = Object.prototype.toString,
	    timer = typeof setImmediate != "undefined" ? function timer(fn) {
		return setImmediate(fn);
	} : setTimeout;

	// dammit, IE8.
	try {
		Object.defineProperty({}, "x", {});
		builtInProp = function builtInProp(obj, name, val, config) {
			return Object.defineProperty(obj, name, {
				value: val,
				writable: true,
				configurable: config !== false
			});
		};
	} catch (err) {
		builtInProp = function builtInProp(obj, name, val) {
			obj[name] = val;
			return obj;
		};
	}

	// Note: using a queue instead of array for efficiency
	scheduling_queue = function Queue() {
		var first, last, item;

		function Item(fn, self) {
			this.fn = fn;
			this.self = self;
			this.next = void 0;
		}

		return {
			add: function add(fn, self) {
				item = new Item(fn, self);
				if (last) {
					last.next = item;
				} else {
					first = item;
				}
				last = item;
				item = void 0;
			},
			drain: function drain() {
				var f = first;
				first = last = cycle = void 0;

				while (f) {
					f.fn.call(f.self);
					f = f.next;
				}
			}
		};
	}();

	function schedule(fn, self) {
		scheduling_queue.add(fn, self);
		if (!cycle) {
			cycle = timer(scheduling_queue.drain);
		}
	}

	// promise duck typing
	function isThenable(o) {
		var _then,
		    o_type = typeof o === "undefined" ? "undefined" : _typeof(o);

		if (o != null && (o_type == "object" || o_type == "function")) {
			_then = o.then;
		}
		return typeof _then == "function" ? _then : false;
	}

	function notify() {
		for (var i = 0; i < this.chain.length; i++) {
			notifyIsolated(this, this.state === 1 ? this.chain[i].success : this.chain[i].failure, this.chain[i]);
		}
		this.chain.length = 0;
	}

	// NOTE: This is a separate function to isolate
	// the `try..catch` so that other code can be
	// optimized better
	function notifyIsolated(self, cb, chain) {
		var ret, _then;
		try {
			if (cb === false) {
				chain.reject(self.msg);
			} else {
				if (cb === true) {
					ret = self.msg;
				} else {
					ret = cb.call(void 0, self.msg);
				}

				if (ret === chain.promise) {
					chain.reject(TypeError("Promise-chain cycle"));
				} else if (_then = isThenable(ret)) {
					_then.call(ret, chain.resolve, chain.reject);
				} else {
					chain.resolve(ret);
				}
			}
		} catch (err) {
			chain.reject(err);
		}
	}

	function resolve(msg) {
		var _then,
		    self = this;

		// already triggered?
		if (self.triggered) {
			return;
		}

		self.triggered = true;

		// unwrap
		if (self.def) {
			self = self.def;
		}

		try {
			if (_then = isThenable(msg)) {
				schedule(function () {
					var def_wrapper = new MakeDefWrapper(self);
					try {
						_then.call(msg, function $resolve$() {
							resolve.apply(def_wrapper, arguments);
						}, function $reject$() {
							reject.apply(def_wrapper, arguments);
						});
					} catch (err) {
						reject.call(def_wrapper, err);
					}
				});
			} else {
				self.msg = msg;
				self.state = 1;
				if (self.chain.length > 0) {
					schedule(notify, self);
				}
			}
		} catch (err) {
			reject.call(new MakeDefWrapper(self), err);
		}
	}

	function reject(msg) {
		var self = this;

		// already triggered?
		if (self.triggered) {
			return;
		}

		self.triggered = true;

		// unwrap
		if (self.def) {
			self = self.def;
		}

		self.msg = msg;
		self.state = 2;
		if (self.chain.length > 0) {
			schedule(notify, self);
		}
	}

	function iteratePromises(Constructor, arr, resolver, rejecter) {
		for (var idx = 0; idx < arr.length; idx++) {
			(function IIFE(idx) {
				Constructor.resolve(arr[idx]).then(function $resolver$(msg) {
					resolver(idx, msg);
				}, rejecter);
			})(idx);
		}
	}

	function MakeDefWrapper(self) {
		this.def = self;
		this.triggered = false;
	}

	function MakeDef(self) {
		this.promise = self;
		this.state = 0;
		this.triggered = false;
		this.chain = [];
		this.msg = void 0;
	}

	function Promise(executor) {
		if (typeof executor != "function") {
			throw TypeError("Not a function");
		}

		if (this.__NPO__ !== 0) {
			throw TypeError("Not a promise");
		}

		// instance shadowing the inherited "brand"
		// to signal an already "initialized" promise
		this.__NPO__ = 1;

		var def = new MakeDef(this);

		this["then"] = function then(success, failure) {
			var o = {
				success: typeof success == "function" ? success : true,
				failure: typeof failure == "function" ? failure : false
			};
			// Note: `then(..)` itself can be borrowed to be used against
			// a different promise constructor for making the chained promise,
			// by substituting a different `this` binding.
			o.promise = new this.constructor(function extractChain(resolve, reject) {
				if (typeof resolve != "function" || typeof reject != "function") {
					throw TypeError("Not a function");
				}

				o.resolve = resolve;
				o.reject = reject;
			});
			def.chain.push(o);

			if (def.state !== 0) {
				schedule(notify, def);
			}

			return o.promise;
		};
		this["catch"] = function $catch$(failure) {
			return this.then(void 0, failure);
		};

		try {
			executor.call(void 0, function publicResolve(msg) {
				resolve.call(def, msg);
			}, function publicReject(msg) {
				reject.call(def, msg);
			});
		} catch (err) {
			reject.call(def, err);
		}
	}

	var PromisePrototype = builtInProp({}, "constructor", Promise,
	/*configurable=*/false);

	// Note: Android 4 cannot use `Object.defineProperty(..)` here
	Promise.prototype = PromisePrototype;

	// built-in "brand" to signal an "uninitialized" promise
	builtInProp(PromisePrototype, "__NPO__", 0,
	/*configurable=*/false);

	builtInProp(Promise, "resolve", function Promise$resolve(msg) {
		var Constructor = this;

		// spec mandated checks
		// note: best "isPromise" check that's practical for now
		if (msg && (typeof msg === "undefined" ? "undefined" : _typeof(msg)) == "object" && msg.__NPO__ === 1) {
			return msg;
		}

		return new Constructor(function executor(resolve, reject) {
			if (typeof resolve != "function" || typeof reject != "function") {
				throw TypeError("Not a function");
			}

			resolve(msg);
		});
	});

	builtInProp(Promise, "reject", function Promise$reject(msg) {
		return new this(function executor(resolve, reject) {
			if (typeof resolve != "function" || typeof reject != "function") {
				throw TypeError("Not a function");
			}

			reject(msg);
		});
	});

	builtInProp(Promise, "all", function Promise$all(arr) {
		var Constructor = this;

		// spec mandated checks
		if (ToString.call(arr) != "[object Array]") {
			return Constructor.reject(TypeError("Not an array"));
		}
		if (arr.length === 0) {
			return Constructor.resolve([]);
		}

		return new Constructor(function executor(resolve, reject) {
			if (typeof resolve != "function" || typeof reject != "function") {
				throw TypeError("Not a function");
			}

			var len = arr.length,
			    msgs = Array(len),
			    count = 0;

			iteratePromises(Constructor, arr, function resolver(idx, msg) {
				msgs[idx] = msg;
				if (++count === len) {
					resolve(msgs);
				}
			}, reject);
		});
	});

	builtInProp(Promise, "race", function Promise$race(arr) {
		var Constructor = this;

		// spec mandated checks
		if (ToString.call(arr) != "[object Array]") {
			return Constructor.reject(TypeError("Not an array"));
		}

		return new Constructor(function executor(resolve, reject) {
			if (typeof resolve != "function" || typeof reject != "function") {
				throw TypeError("Not a function");
			}

			iteratePromises(Constructor, arr, function resolver(idx, msg) {
				resolve(msg);
			}, reject);
		});
	});

	return Promise;
});
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js"), __webpack_require__(/*! ./../../timers-browserify/main.js */ "./node_modules/timers-browserify/main.js").setImmediate))

/***/ }),

/***/ "./node_modules/process/browser.js":
/*!*****************************************!*\
  !*** ./node_modules/process/browser.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout() {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
})();
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch (e) {
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch (e) {
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }
}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e) {
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e) {
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }
}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while (len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) {
    return [];
};

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () {
    return '/';
};
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function () {
    return 0;
};

/***/ }),

/***/ "./node_modules/setimmediate/setImmediate.js":
/*!***************************************************!*\
  !*** ./node_modules/setimmediate/setImmediate.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, process) {

(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
        // Callback can either be a function or a string
        if (typeof callback !== "function") {
            callback = new Function("" + callback);
        }
        // Copy function arguments
        var args = new Array(arguments.length - 1);
        for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i + 1];
        }
        // Store and register the task
        var task = { callback: callback, args: args };
        tasksByHandle[nextHandle] = task;
        registerImmediate(nextHandle);
        return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
            case 0:
                callback();
                break;
            case 1:
                callback(args[0]);
                break;
            case 2:
                callback(args[0], args[1]);
                break;
            case 3:
                callback(args[0], args[1], args[2]);
                break;
            default:
                callback.apply(undefined, args);
                break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function registerImmediate(handle) {
            process.nextTick(function () {
                runIfPresent(handle);
            });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function () {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function onGlobalMessage(event) {
            if (event.source === global && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function registerImmediate(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function (event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function registerImmediate(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function registerImmediate(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function registerImmediate(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();
    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();
    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();
    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();
    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
})(typeof self === "undefined" ? typeof global === "undefined" ? undefined : global : self);
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js"), __webpack_require__(/*! ./../process/browser.js */ "./node_modules/process/browser.js")))

/***/ }),

/***/ "./node_modules/superagent/lib/agent-base.js":
/*!***************************************************!*\
  !*** ./node_modules/superagent/lib/agent-base.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function Agent() {
  this._defaults = [];
}

["use", "on", "once", "set", "query", "type", "accept", "auth", "withCredentials", "sortQuery", "retry", "ok", "redirects", "timeout", "buffer", "serialize", "parse", "ca", "key", "pfx", "cert"].forEach(function (fn) {
  /** Default setting for all requests from this agent */
  Agent.prototype[fn] = function () /*varargs*/{
    this._defaults.push({ fn: fn, arguments: arguments });
    return this;
  };
});

Agent.prototype._setDefaults = function (req) {
  this._defaults.forEach(function (def) {
    req[def.fn].apply(req, def.arguments);
  });
};

module.exports = Agent;

/***/ }),

/***/ "./node_modules/superagent/lib/client.js":
/*!***********************************************!*\
  !*** ./node_modules/superagent/lib/client.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') {
  // Browser window
  root = window;
} else if (typeof self !== 'undefined') {
  // Web Worker
  root = self;
} else {
  // Other environments
  console.warn("Using browser-only version of superagent in non-browser environment");
  root = undefined;
}

var Emitter = __webpack_require__(/*! component-emitter */ "./node_modules/component-emitter/index.js");
var RequestBase = __webpack_require__(/*! ./request-base */ "./node_modules/superagent/lib/request-base.js");
var isObject = __webpack_require__(/*! ./is-object */ "./node_modules/superagent/lib/is-object.js");
var ResponseBase = __webpack_require__(/*! ./response-base */ "./node_modules/superagent/lib/response-base.js");
var Agent = __webpack_require__(/*! ./agent-base */ "./node_modules/superagent/lib/agent-base.js");

/**
 * Noop.
 */

function noop() {};

/**
 * Expose `request`.
 */

var request = exports = module.exports = function (method, url) {
  // callback
  if ('function' == typeof url) {
    return new exports.Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new exports.Request('GET', method);
  }

  return new exports.Request(method, url);
};

exports.Request = Request;

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest && (!root.location || 'file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest();
  } else {
    try {
      return new ActiveXObject('Microsoft.XMLHTTP');
    } catch (e) {}
    try {
      return new ActiveXObject('Msxml2.XMLHTTP.6.0');
    } catch (e) {}
    try {
      return new ActiveXObject('Msxml2.XMLHTTP.3.0');
    } catch (e) {}
    try {
      return new ActiveXObject('Msxml2.XMLHTTP');
    } catch (e) {}
  }
  throw Error("Browser-only version of superagent could not find XHR");
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim ? function (s) {
  return s.trim();
} : function (s) {
  return s.replace(/(^\s*|\s*$)/g, '');
};

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    pushEncodedKeyValuePair(pairs, key, obj[key]);
  }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (val != null) {
    if (Array.isArray(val)) {
      val.forEach(function (v) {
        pushEncodedKeyValuePair(pairs, key, v);
      });
    } else if (isObject(val)) {
      for (var subkey in val) {
        pushEncodedKeyValuePair(pairs, key + '[' + subkey + ']', val[subkey]);
      }
    } else {
      pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
    }
  } else if (val === null) {
    pairs.push(encodeURIComponent(key));
  }
}

/**
 * Expose serialization method.
 */

request.serializeObject = serialize;

/**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var pair;
  var pos;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    pos = pair.indexOf('=');
    if (pos == -1) {
      obj[decodeURIComponent(pair)] = '';
    } else {
      obj[decodeURIComponent(pair.slice(0, pos))] = decodeURIComponent(pair.slice(pos + 1));
    }
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'text/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

request.serialize = {
  'application/x-www-form-urlencoded': serialize,
  'application/json': JSON.stringify
};

/**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    if (index === -1) {
      // could be empty line, just skip it
      continue;
    }
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  // should match /json or +json
  // but not /json-seq
  return (/[\/+]json($|[^-\w])/.test(mime)
  );
}

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req) {
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = this.req.method != 'HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text') || typeof this.xhr.responseType === 'undefined' ? this.xhr.responseText : null;
  this.statusText = this.req.xhr.statusText;
  var status = this.xhr.status;
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }
  this._setStatusProperties(status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this._setHeaderProperties(this.header);

  if (null === this.text && req._responseType) {
    this.body = this.xhr.response;
  } else {
    this.body = this.req.method != 'HEAD' ? this._parseBody(this.text ? this.text : this.xhr.response) : null;
  }
}

ResponseBase(Response.prototype);

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype._parseBody = function (str) {
  var parse = request.parse[this.type];
  if (this.req._parser) {
    return this.req._parser(this, str);
  }
  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }
  return parse && str && (str.length || str instanceof Object) ? parse(str) : null;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function () {
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case
  this._header = {}; // coerces header names to lowercase
  this.on('end', function () {
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch (e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      if (self.xhr) {
        // ie9 doesn't have 'response' property
        err.rawResponse = typeof self.xhr.responseType == 'undefined' ? self.xhr.responseText : self.xhr.response;
        // issue #876: return the http status code if the response parsing fails
        err.status = self.xhr.status ? self.xhr.status : null;
        err.statusCode = err.status; // backwards-compat only
      } else {
        err.rawResponse = null;
        err.status = null;
      }

      return self.callback(err);
    }

    self.emit('response', res);

    var new_err;
    try {
      if (!self._isResponseOK(res)) {
        new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
      }
    } catch (custom_err) {
      new_err = custom_err; // ok() callback can throw
    }

    // #1000 don't catch errors from the callback to avoid double calling it
    if (new_err) {
      new_err.original = err;
      new_err.response = res;
      new_err.status = res.status;
      self.callback(new_err, res);
    } else {
      self.callback(null, res);
    }
  });
}

/**
 * Mixin `Emitter` and `RequestBase`.
 */

Emitter(Request.prototype);
RequestBase(Request.prototype);

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function (type) {
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function (type) {
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} [pass] optional in case of using 'bearer' as type
 * @param {Object} options with 'type' property 'auto', 'basic' or 'bearer' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function (user, pass, options) {
  if (1 === arguments.length) pass = '';
  if ((typeof pass === 'undefined' ? 'undefined' : _typeof(pass)) === 'object' && pass !== null) {
    // pass is optional and can be replaced with options
    options = pass;
    pass = '';
  }
  if (!options) {
    options = {
      type: 'function' === typeof btoa ? 'basic' : 'auto'
    };
  }

  var encoder = function encoder(string) {
    if ('function' === typeof btoa) {
      return btoa(string);
    }
    throw new Error('Cannot use basic auth, btoa is not a function');
  };

  return this._auth(user, pass, options, encoder);
};

/**
 * Add query-string `val`.
 *
 * Examples:
 *
 *   request.get('/shoes')
 *     .query('size=10')
 *     .query({ color: 'blue' })
 *
 * @param {Object|String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.query = function (val) {
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `options` (or filename).
 *
 * ``` js
 * request.post('/upload')
 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String|Object} options
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function (field, file, options) {
  if (file) {
    if (this._data) {
      throw Error("superagent can't mix .send() and .attach()");
    }

    this._getFormData().append(field, file, options || file.name);
  }
  return this;
};

Request.prototype._getFormData = function () {
  if (!this._formData) {
    this._formData = new root.FormData();
  }
  return this._formData;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function (err, res) {
  if (this._shouldRetry(err, res)) {
    return this._retry();
  }

  var fn = this._callback;
  this.clearTimeout();

  if (err) {
    if (this._maxRetries) err.retries = this._retries - 1;
    this.emit('error', err);
  }

  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function () {
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

// This only warns, because the request is still likely to work
Request.prototype.buffer = Request.prototype.ca = Request.prototype.agent = function () {
  console.warn("This is not supported in browser version of superagent");
  return this;
};

// This throws, because it can't send/receive data as expected
Request.prototype.pipe = Request.prototype.write = function () {
  throw Error("Streaming is not supported in browser version of superagent");
};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
Request.prototype._isHost = function _isHost(obj) {
  // Native objects stringify to [object File], [object Blob], [object FormData], etc.
  return obj && 'object' === (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function (fn) {
  if (this._endCalled) {
    console.warn("Warning: .end() was called twice. This is not supported in superagent");
  }
  this._endCalled = true;

  // store callback
  this._callback = fn || noop;

  // querystring
  this._finalizeQueryString();

  return this._end();
};

Request.prototype._end = function () {
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var data = this._formData || this._data;

  this._setTimeouts();

  // state change
  xhr.onreadystatechange = function () {
    var readyState = xhr.readyState;
    if (readyState >= 2 && self._responseTimeoutTimer) {
      clearTimeout(self._responseTimeoutTimer);
    }
    if (4 != readyState) {
      return;
    }

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try {
      status = xhr.status;
    } catch (e) {
      status = 0;
    }

    if (!status) {
      if (self.timedout || self._aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function handleProgress(direction, e) {
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = direction;
    self.emit('progress', e);
  };
  if (this.hasListeners('progress')) {
    try {
      xhr.onprogress = handleProgress.bind(null, 'download');
      if (xhr.upload) {
        xhr.upload.onprogress = handleProgress.bind(null, 'upload');
      }
    } catch (e) {
      // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
      // Reported here:
      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
    }
  }

  // initiate request
  try {
    if (this.username && this.password) {
      xhr.open(this.method, this.url, true, this.username, this.password);
    } else {
      xhr.open(this.method, this.url, true);
    }
  } catch (err) {
    // see #1149
    return this.callback(err);
  }

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if (!this._formData && 'GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];
    var serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) {
      serialize = request.serialize['application/json'];
    }
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;

    if (this.header.hasOwnProperty(field)) xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};

request.agent = function () {
  return new Agent();
};

["GET", "POST", "OPTIONS", "PATCH", "PUT", "DELETE"].forEach(function (method) {
  Agent.prototype[method.toLowerCase()] = function (url, fn) {
    var req = new request.Request(method, url);
    this._setDefaults(req);
    if (fn) {
      req.end(fn);
    }
    return req;
  };
});

Agent.prototype.del = Agent.prototype['delete'];

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.get = function (url, data, fn) {
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.head = function (url, data, fn) {
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * OPTIONS query to `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.options = function (url, data, fn) {
  var req = request('OPTIONS', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

function del(url, data, fn) {
  var req = request('DELETE', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
}

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.patch = function (url, data, fn) {
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.post = function (url, data, fn) {
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.put = function (url, data, fn) {
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/***/ }),

/***/ "./node_modules/superagent/lib/is-object.js":
/*!**************************************************!*\
  !*** ./node_modules/superagent/lib/is-object.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function isObject(obj) {
  return null !== obj && 'object' === (typeof obj === 'undefined' ? 'undefined' : _typeof(obj));
}

module.exports = isObject;

/***/ }),

/***/ "./node_modules/superagent/lib/request-base.js":
/*!*****************************************************!*\
  !*** ./node_modules/superagent/lib/request-base.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Module of mixed-in functions shared between node and client code
 */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isObject = __webpack_require__(/*! ./is-object */ "./node_modules/superagent/lib/is-object.js");

/**
 * Expose `RequestBase`.
 */

module.exports = RequestBase;

/**
 * Initialize a new `RequestBase`.
 *
 * @api public
 */

function RequestBase(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in RequestBase.prototype) {
    obj[key] = RequestBase.prototype[key];
  }
  return obj;
}

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.clearTimeout = function _clearTimeout() {
  clearTimeout(this._timer);
  clearTimeout(this._responseTimeoutTimer);
  delete this._timer;
  delete this._responseTimeoutTimer;
  return this;
};

/**
 * Override default response body parser
 *
 * This function will be called to convert incoming data into request.body
 *
 * @param {Function}
 * @api public
 */

RequestBase.prototype.parse = function parse(fn) {
  this._parser = fn;
  return this;
};

/**
 * Set format of binary response body.
 * In browser valid formats are 'blob' and 'arraybuffer',
 * which return Blob and ArrayBuffer, respectively.
 *
 * In Node all values result in Buffer.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.responseType = function (val) {
  this._responseType = val;
  return this;
};

/**
 * Override default request body serializer
 *
 * This function will be called to convert data set via .send or .attach into payload to send
 *
 * @param {Function}
 * @api public
 */

RequestBase.prototype.serialize = function serialize(fn) {
  this._serializer = fn;
  return this;
};

/**
 * Set timeouts.
 *
 * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
 * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
 *
 * Value of 0 or false means no timeout.
 *
 * @param {Number|Object} ms or {response, deadline}
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.timeout = function timeout(options) {
  if (!options || 'object' !== (typeof options === 'undefined' ? 'undefined' : _typeof(options))) {
    this._timeout = options;
    this._responseTimeout = 0;
    return this;
  }

  for (var option in options) {
    switch (option) {
      case 'deadline':
        this._timeout = options.deadline;
        break;
      case 'response':
        this._responseTimeout = options.response;
        break;
      default:
        console.warn("Unknown timeout option", option);
    }
  }
  return this;
};

/**
 * Set number of retry attempts on error.
 *
 * Failed requests will be retried 'count' times if timeout or err.code >= 500.
 *
 * @param {Number} count
 * @param {Function} [fn]
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.retry = function retry(count, fn) {
  // Default to 1 if no count passed or true
  if (arguments.length === 0 || count === true) count = 1;
  if (count <= 0) count = 0;
  this._maxRetries = count;
  this._retries = 0;
  this._retryCallback = fn;
  return this;
};

var ERROR_CODES = ['ECONNRESET', 'ETIMEDOUT', 'EADDRINFO', 'ESOCKETTIMEDOUT'];

/**
 * Determine if a request should be retried.
 * (Borrowed from segmentio/superagent-retry)
 *
 * @param {Error} err
 * @param {Response} [res]
 * @returns {Boolean}
 */
RequestBase.prototype._shouldRetry = function (err, res) {
  if (!this._maxRetries || this._retries++ >= this._maxRetries) {
    return false;
  }
  if (this._retryCallback) {
    try {
      var override = this._retryCallback(err, res);
      if (override === true) return true;
      if (override === false) return false;
      // undefined falls back to defaults
    } catch (e) {
      console.error(e);
    }
  }
  if (res && res.status && res.status >= 500 && res.status != 501) return true;
  if (err) {
    if (err.code && ~ERROR_CODES.indexOf(err.code)) return true;
    // Superagent timeout
    if (err.timeout && err.code == 'ECONNABORTED') return true;
    if (err.crossDomain) return true;
  }
  return false;
};

/**
 * Retry request
 *
 * @return {Request} for chaining
 * @api private
 */

RequestBase.prototype._retry = function () {

  this.clearTimeout();

  // node
  if (this.req) {
    this.req = null;
    this.req = this.request();
  }

  this._aborted = false;
  this.timedout = false;

  return this._end();
};

/**
 * Promise support
 *
 * @param {Function} resolve
 * @param {Function} [reject]
 * @return {Request}
 */

RequestBase.prototype.then = function then(resolve, reject) {
  if (!this._fullfilledPromise) {
    var self = this;
    if (this._endCalled) {
      console.warn("Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises");
    }
    this._fullfilledPromise = new Promise(function (innerResolve, innerReject) {
      self.end(function (err, res) {
        if (err) innerReject(err);else innerResolve(res);
      });
    });
  }
  return this._fullfilledPromise.then(resolve, reject);
};

RequestBase.prototype['catch'] = function (cb) {
  return this.then(undefined, cb);
};

/**
 * Allow for extension
 */

RequestBase.prototype.use = function use(fn) {
  fn(this);
  return this;
};

RequestBase.prototype.ok = function (cb) {
  if ('function' !== typeof cb) throw Error("Callback required");
  this._okCallback = cb;
  return this;
};

RequestBase.prototype._isResponseOK = function (res) {
  if (!res) {
    return false;
  }

  if (this._okCallback) {
    return this._okCallback(res);
  }

  return res.status >= 200 && res.status < 300;
};

/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

RequestBase.prototype.get = function (field) {
  return this._header[field.toLowerCase()];
};

/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */

RequestBase.prototype.getHeader = RequestBase.prototype.get;

/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.set = function (field, val) {
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */
RequestBase.prototype.unset = function (field) {
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Write the field `name` and `val`, or multiple fields with one object
 * for "multipart/form-data" request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 *
 * request.post('/upload')
 *   .field({ foo: 'bar', baz: 'qux' })
 *   .end(callback);
 * ```
 *
 * @param {String|Object} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */
RequestBase.prototype.field = function (name, val) {
  // name should be either a string or an object.
  if (null === name || undefined === name) {
    throw new Error('.field(name, val) name can not be empty');
  }

  if (this._data) {
    console.error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObject(name)) {
    for (var key in name) {
      this.field(key, name[key]);
    }
    return this;
  }

  if (Array.isArray(val)) {
    for (var i in val) {
      this.field(name, val[i]);
    }
    return this;
  }

  // val should be defined now
  if (null === val || undefined === val) {
    throw new Error('.field(name, val) val can not be empty');
  }
  if ('boolean' === typeof val) {
    val = '' + val;
  }
  this._getFormData().append(name, val);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */
RequestBase.prototype.abort = function () {
  if (this._aborted) {
    return this;
  }
  this._aborted = true;
  this.xhr && this.xhr.abort(); // browser
  this.req && this.req.abort(); // node
  this.clearTimeout();
  this.emit('abort');
  return this;
};

RequestBase.prototype._auth = function (user, pass, options, base64Encoder) {
  switch (options.type) {
    case 'basic':
      this.set('Authorization', 'Basic ' + base64Encoder(user + ':' + pass));
      break;

    case 'auto':
      this.username = user;
      this.password = pass;
      break;

    case 'bearer':
      // usage would be .auth(accessToken, { type: 'bearer' })
      this.set('Authorization', 'Bearer ' + user);
      break;
  }
  return this;
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

RequestBase.prototype.withCredentials = function (on) {
  // This is browser-only functionality. Node side is no-op.
  if (on == undefined) on = true;
  this._withCredentials = on;
  return this;
};

/**
 * Set the max redirects to `n`. Does noting in browser XHR implementation.
 *
 * @param {Number} n
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.redirects = function (n) {
  this._maxRedirects = n;
  return this;
};

/**
 * Maximum size of buffered response body, in bytes. Counts uncompressed size.
 * Default 200MB.
 *
 * @param {Number} n
 * @return {Request} for chaining
 */
RequestBase.prototype.maxResponseSize = function (n) {
  if ('number' !== typeof n) {
    throw TypeError("Invalid argument");
  }
  this._maxResponseSize = n;
  return this;
};

/**
 * Convert to a plain javascript object (not JSON string) of scalar properties.
 * Note as this method is designed to return a useful non-this value,
 * it cannot be chained.
 *
 * @return {Object} describing method, url, and data of this request
 * @api public
 */

RequestBase.prototype.toJSON = function () {
  return {
    method: this.method,
    url: this.url,
    data: this._data,
    headers: this._header
  };
};

/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
 *      request.post('/user')
 *        .send('name=tobi')
 *        .send('species=ferret')
 *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.send = function (data) {
  var isObj = isObject(data);
  var type = this._header['content-type'];

  if (this._formData) {
    console.error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObj && !this._data) {
    if (Array.isArray(data)) {
      this._data = [];
    } else if (!this._isHost(data)) {
      this._data = {};
    }
  } else if (data && this._data && this._isHost(this._data)) {
    throw Error("Can't merge these send calls");
  }

  // merge
  if (isObj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    // default to x-www-form-urlencoded
    if (!type) this.type('form');
    type = this._header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data ? this._data + '&' + data : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!isObj || this._isHost(data)) {
    return this;
  }

  // default to json
  if (!type) this.type('json');
  return this;
};

/**
 * Sort `querystring` by the sort function
 *
 *
 * Examples:
 *
 *       // default order
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery()
 *         .end(callback)
 *
 *       // customized sort function
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery(function(a, b){
 *           return a.length - b.length;
 *         })
 *         .end(callback)
 *
 *
 * @param {Function} sort
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.sortQuery = function (sort) {
  // _sort default to true but otherwise can be a function or boolean
  this._sort = typeof sort === 'undefined' ? true : sort;
  return this;
};

/**
 * Compose querystring to append to req.url
 *
 * @api private
 */
RequestBase.prototype._finalizeQueryString = function () {
  var query = this._query.join('&');
  if (query) {
    this.url += (this.url.indexOf('?') >= 0 ? '&' : '?') + query;
  }
  this._query.length = 0; // Makes the call idempotent

  if (this._sort) {
    var index = this.url.indexOf('?');
    if (index >= 0) {
      var queryArr = this.url.substring(index + 1).split('&');
      if ('function' === typeof this._sort) {
        queryArr.sort(this._sort);
      } else {
        queryArr.sort();
      }
      this.url = this.url.substring(0, index) + '?' + queryArr.join('&');
    }
  }
};

// For backwards compat only
RequestBase.prototype._appendQueryString = function () {
  console.trace("Unsupported");
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

RequestBase.prototype._timeoutError = function (reason, timeout, errno) {
  if (this._aborted) {
    return;
  }
  var err = new Error(reason + timeout + 'ms exceeded');
  err.timeout = timeout;
  err.code = 'ECONNABORTED';
  err.errno = errno;
  this.timedout = true;
  this.abort();
  this.callback(err);
};

RequestBase.prototype._setTimeouts = function () {
  var self = this;

  // deadline
  if (this._timeout && !this._timer) {
    this._timer = setTimeout(function () {
      self._timeoutError('Timeout of ', self._timeout, 'ETIME');
    }, this._timeout);
  }
  // response timeout
  if (this._responseTimeout && !this._responseTimeoutTimer) {
    this._responseTimeoutTimer = setTimeout(function () {
      self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
    }, this._responseTimeout);
  }
};

/***/ }),

/***/ "./node_modules/superagent/lib/response-base.js":
/*!******************************************************!*\
  !*** ./node_modules/superagent/lib/response-base.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Module dependencies.
 */

var utils = __webpack_require__(/*! ./utils */ "./node_modules/superagent/lib/utils.js");

/**
 * Expose `ResponseBase`.
 */

module.exports = ResponseBase;

/**
 * Initialize a new `ResponseBase`.
 *
 * @api public
 */

function ResponseBase(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in ResponseBase.prototype) {
    obj[key] = ResponseBase.prototype[key];
  }
  return obj;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

ResponseBase.prototype.get = function (field) {
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

ResponseBase.prototype._setHeaderProperties = function (header) {
  // TODO: moar!
  // TODO: make this a util

  // content-type
  var ct = header['content-type'] || '';
  this.type = utils.type(ct);

  // params
  var params = utils.params(ct);
  for (var key in params) {
    this[key] = params[key];
  }this.links = {};

  // links
  try {
    if (header.link) {
      this.links = utils.parseLinks(header.link);
    }
  } catch (err) {
    // ignore
  }
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

ResponseBase.prototype._setStatusProperties = function (status) {
  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.redirect = 3 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = 4 == type || 5 == type ? this.toError() : false;

  // sugar
  this.created = 201 == status;
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.forbidden = 403 == status;
  this.notFound = 404 == status;
  this.unprocessableEntity = 422 == status;
};

/***/ }),

/***/ "./node_modules/superagent/lib/utils.js":
/*!**********************************************!*\
  !*** ./node_modules/superagent/lib/utils.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.type = function (str) {
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

exports.params = function (str) {
  return str.split(/ *; */).reduce(function (obj, str) {
    var parts = str.split(/ *= */);
    var key = parts.shift();
    var val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Parse Link header fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

exports.parseLinks = function (str) {
  return str.split(/ *, */).reduce(function (obj, str) {
    var parts = str.split(/ *; */);
    var url = parts[0].slice(1, -1);
    var rel = parts[1].split(/ *= */)[1].slice(1, -1);
    obj[rel] = url;
    return obj;
  }, {});
};

/**
 * Strip content related fields from `header`.
 *
 * @param {Object} header
 * @return {Object} header
 * @api private
 */

exports.cleanHeader = function (header, changesOrigin) {
  delete header['content-type'];
  delete header['content-length'];
  delete header['transfer-encoding'];
  delete header['host'];
  // secuirty
  if (changesOrigin) {
    delete header['authorization'];
    delete header['cookie'];
  }
  return header;
};

/***/ }),

/***/ "./node_modules/timers-browserify/main.js":
/*!************************************************!*\
  !*** ./node_modules/timers-browserify/main.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

var scope = typeof global !== "undefined" && global || typeof self !== "undefined" && self || window;
var apply = Function.prototype.apply;

// DOM APIs, for completeness

exports.setTimeout = function () {
  return new Timeout(apply.call(setTimeout, scope, arguments), clearTimeout);
};
exports.setInterval = function () {
  return new Timeout(apply.call(setInterval, scope, arguments), clearInterval);
};
exports.clearTimeout = exports.clearInterval = function (timeout) {
  if (timeout) {
    timeout.close();
  }
};

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function () {};
Timeout.prototype.close = function () {
  this._clearFn.call(scope, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function (item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function (item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function (item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout) item._onTimeout();
    }, msecs);
  }
};

// setimmediate attaches itself to the global object
__webpack_require__(/*! setimmediate */ "./node_modules/setimmediate/setImmediate.js");
// On some exotic environments, it's not clear which object `setimmediate` was
// able to install onto.  Search each possibility in the same order as the
// `setimmediate` library.
exports.setImmediate = typeof self !== "undefined" && self.setImmediate || typeof global !== "undefined" && global.setImmediate || undefined && undefined.setImmediate;
exports.clearImmediate = typeof self !== "undefined" && self.clearImmediate || typeof global !== "undefined" && global.clearImmediate || undefined && undefined.clearImmediate;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var g;

// This works in non-strict mode
g = function () {
	return this;
}();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if ((typeof window === "undefined" ? "undefined" : _typeof(window)) === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;

/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9QYXRoTG9hZGVyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL1BhdGhMb2FkZXIvLi9pbmRleC5qcyIsIndlYnBhY2s6Ly9QYXRoTG9hZGVyLy4vbGliL2xvYWRlcnMvZmlsZS1icm93c2VyLmpzIiwid2VicGFjazovL1BhdGhMb2FkZXIvLi9saWIvbG9hZGVycy9odHRwLmpzIiwid2VicGFjazovL1BhdGhMb2FkZXIvLi9ub2RlX21vZHVsZXMvY29tcG9uZW50LWVtaXR0ZXIvaW5kZXguanMiLCJ3ZWJwYWNrOi8vUGF0aExvYWRlci8uL25vZGVfbW9kdWxlcy9uYXRpdmUtcHJvbWlzZS1vbmx5L2xpYi9ucG8uc3JjLmpzIiwid2VicGFjazovL1BhdGhMb2FkZXIvLi9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwid2VicGFjazovL1BhdGhMb2FkZXIvLi9ub2RlX21vZHVsZXMvc2V0aW1tZWRpYXRlL3NldEltbWVkaWF0ZS5qcyIsIndlYnBhY2s6Ly9QYXRoTG9hZGVyLy4vbm9kZV9tb2R1bGVzL3N1cGVyYWdlbnQvbGliL2FnZW50LWJhc2UuanMiLCJ3ZWJwYWNrOi8vUGF0aExvYWRlci8uL25vZGVfbW9kdWxlcy9zdXBlcmFnZW50L2xpYi9jbGllbnQuanMiLCJ3ZWJwYWNrOi8vUGF0aExvYWRlci8uL25vZGVfbW9kdWxlcy9zdXBlcmFnZW50L2xpYi9pcy1vYmplY3QuanMiLCJ3ZWJwYWNrOi8vUGF0aExvYWRlci8uL25vZGVfbW9kdWxlcy9zdXBlcmFnZW50L2xpYi9yZXF1ZXN0LWJhc2UuanMiLCJ3ZWJwYWNrOi8vUGF0aExvYWRlci8uL25vZGVfbW9kdWxlcy9zdXBlcmFnZW50L2xpYi9yZXNwb25zZS1iYXNlLmpzIiwid2VicGFjazovL1BhdGhMb2FkZXIvLi9ub2RlX21vZHVsZXMvc3VwZXJhZ2VudC9saWIvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vUGF0aExvYWRlci8uL25vZGVfbW9kdWxlcy90aW1lcnMtYnJvd3NlcmlmeS9tYWluLmpzIiwid2VicGFjazovL1BhdGhMb2FkZXIvKHdlYnBhY2spL2J1aWxkaW4vZ2xvYmFsLmpzIl0sIm5hbWVzIjpbInN1cHBvcnRlZExvYWRlcnMiLCJmaWxlIiwicmVxdWlyZSIsImh0dHAiLCJodHRwcyIsImRlZmF1bHRMb2FkZXIiLCJ3aW5kb3ciLCJpbXBvcnRTY3JpcHRzIiwiUHJvbWlzZSIsImdldFNjaGVtZSIsImxvY2F0aW9uIiwiaW5kZXhPZiIsInNwbGl0IiwiZ2V0TG9hZGVyIiwic2NoZW1lIiwibG9hZGVyIiwiRXJyb3IiLCJtb2R1bGUiLCJleHBvcnRzIiwibG9hZCIsIm9wdGlvbnMiLCJhbGxUYXNrcyIsInJlc29sdmUiLCJ0aGVuIiwiVHlwZUVycm9yIiwicHJvY2Vzc0NvbnRlbnQiLCJyZWplY3QiLCJlcnIiLCJkb2N1bWVudCIsInJlcyIsInRleHQiLCJwcm9jZXNzZWQiLCJ1bnN1cHBvcnRlZEVycm9yIiwiZ2V0QmFzZSIsImZuIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwicmVxdWVzdCIsInN1cHBvcnRlZEh0dHBNZXRob2RzIiwiY2FsbGJhY2siLCJyZWFsTWV0aG9kIiwibWV0aG9kIiwidG9Mb3dlckNhc2UiLCJyZWFsUmVxdWVzdCIsIm1ha2VSZXF1ZXN0IiwicmVxIiwiT2JqZWN0IiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJjYWxsIiwicHJvY2VzcyIsImJ1ZmZlciIsImVuZCIsImVycjIiLCJ1bmRlZmluZWQiLCJzbGljZSIsImpvaW4iLCJwcmVwYXJlUmVxdWVzdCIsIkVtaXR0ZXIiLCJvYmoiLCJtaXhpbiIsImtleSIsIm9uIiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2ZW50IiwiX2NhbGxiYWNrcyIsInB1c2giLCJvbmNlIiwib2ZmIiwiYXBwbHkiLCJyZW1vdmVMaXN0ZW5lciIsInJlbW92ZUFsbExpc3RlbmVycyIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJjYWxsYmFja3MiLCJjYiIsImkiLCJzcGxpY2UiLCJlbWl0IiwiYXJncyIsImxlbiIsImxpc3RlbmVycyIsImhhc0xpc3RlbmVycyIsIlVNRCIsIm5hbWUiLCJjb250ZXh0IiwiZGVmaW5pdGlvbiIsImRlZmluZSIsIiRBTUQkIiwiZ2xvYmFsIiwiREVGIiwiYnVpbHRJblByb3AiLCJjeWNsZSIsInNjaGVkdWxpbmdfcXVldWUiLCJUb1N0cmluZyIsInRpbWVyIiwic2V0SW1tZWRpYXRlIiwic2V0VGltZW91dCIsImRlZmluZVByb3BlcnR5IiwidmFsIiwiY29uZmlnIiwidmFsdWUiLCJ3cml0YWJsZSIsImNvbmZpZ3VyYWJsZSIsIlF1ZXVlIiwiZmlyc3QiLCJsYXN0IiwiaXRlbSIsIkl0ZW0iLCJzZWxmIiwibmV4dCIsImFkZCIsImRyYWluIiwiZiIsInNjaGVkdWxlIiwiaXNUaGVuYWJsZSIsIm8iLCJfdGhlbiIsIm9fdHlwZSIsIm5vdGlmeSIsImNoYWluIiwibm90aWZ5SXNvbGF0ZWQiLCJzdGF0ZSIsInN1Y2Nlc3MiLCJmYWlsdXJlIiwicmV0IiwibXNnIiwicHJvbWlzZSIsInRyaWdnZXJlZCIsImRlZiIsImRlZl93cmFwcGVyIiwiTWFrZURlZldyYXBwZXIiLCIkcmVzb2x2ZSQiLCIkcmVqZWN0JCIsIml0ZXJhdGVQcm9taXNlcyIsIkNvbnN0cnVjdG9yIiwiYXJyIiwicmVzb2x2ZXIiLCJyZWplY3RlciIsImlkeCIsIklJRkUiLCIkcmVzb2x2ZXIkIiwiTWFrZURlZiIsImV4ZWN1dG9yIiwiX19OUE9fXyIsImNvbnN0cnVjdG9yIiwiZXh0cmFjdENoYWluIiwiJGNhdGNoJCIsInB1YmxpY1Jlc29sdmUiLCJwdWJsaWNSZWplY3QiLCJQcm9taXNlUHJvdG90eXBlIiwiUHJvbWlzZSRyZXNvbHZlIiwiUHJvbWlzZSRyZWplY3QiLCJQcm9taXNlJGFsbCIsIm1zZ3MiLCJBcnJheSIsImNvdW50IiwiUHJvbWlzZSRyYWNlIiwiY2FjaGVkU2V0VGltZW91dCIsImNhY2hlZENsZWFyVGltZW91dCIsImRlZmF1bHRTZXRUaW1vdXQiLCJkZWZhdWx0Q2xlYXJUaW1lb3V0IiwiZSIsImNsZWFyVGltZW91dCIsInJ1blRpbWVvdXQiLCJmdW4iLCJydW5DbGVhclRpbWVvdXQiLCJtYXJrZXIiLCJxdWV1ZSIsImRyYWluaW5nIiwiY3VycmVudFF1ZXVlIiwicXVldWVJbmRleCIsImNsZWFuVXBOZXh0VGljayIsImNvbmNhdCIsImRyYWluUXVldWUiLCJ0aW1lb3V0IiwicnVuIiwibmV4dFRpY2siLCJhcnJheSIsInRpdGxlIiwiYnJvd3NlciIsImVudiIsImFyZ3YiLCJ2ZXJzaW9uIiwidmVyc2lvbnMiLCJub29wIiwiYWRkTGlzdGVuZXIiLCJwcmVwZW5kTGlzdGVuZXIiLCJwcmVwZW5kT25jZUxpc3RlbmVyIiwiYmluZGluZyIsImN3ZCIsImNoZGlyIiwiZGlyIiwidW1hc2siLCJuZXh0SGFuZGxlIiwidGFza3NCeUhhbmRsZSIsImN1cnJlbnRseVJ1bm5pbmdBVGFzayIsImRvYyIsInJlZ2lzdGVySW1tZWRpYXRlIiwiRnVuY3Rpb24iLCJ0YXNrIiwiY2xlYXJJbW1lZGlhdGUiLCJoYW5kbGUiLCJydW5JZlByZXNlbnQiLCJpbnN0YWxsTmV4dFRpY2tJbXBsZW1lbnRhdGlvbiIsImNhblVzZVBvc3RNZXNzYWdlIiwicG9zdE1lc3NhZ2UiLCJwb3N0TWVzc2FnZUlzQXN5bmNocm9ub3VzIiwib2xkT25NZXNzYWdlIiwib25tZXNzYWdlIiwiaW5zdGFsbFBvc3RNZXNzYWdlSW1wbGVtZW50YXRpb24iLCJtZXNzYWdlUHJlZml4IiwiTWF0aCIsInJhbmRvbSIsIm9uR2xvYmFsTWVzc2FnZSIsInNvdXJjZSIsImRhdGEiLCJhdHRhY2hFdmVudCIsImluc3RhbGxNZXNzYWdlQ2hhbm5lbEltcGxlbWVudGF0aW9uIiwiY2hhbm5lbCIsIk1lc3NhZ2VDaGFubmVsIiwicG9ydDEiLCJwb3J0MiIsImluc3RhbGxSZWFkeVN0YXRlQ2hhbmdlSW1wbGVtZW50YXRpb24iLCJodG1sIiwiZG9jdW1lbnRFbGVtZW50Iiwic2NyaXB0IiwiY3JlYXRlRWxlbWVudCIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsInJlbW92ZUNoaWxkIiwiYXBwZW5kQ2hpbGQiLCJpbnN0YWxsU2V0VGltZW91dEltcGxlbWVudGF0aW9uIiwiYXR0YWNoVG8iLCJnZXRQcm90b3R5cGVPZiIsIkFnZW50IiwiX2RlZmF1bHRzIiwiZm9yRWFjaCIsIl9zZXREZWZhdWx0cyIsInJvb3QiLCJjb25zb2xlIiwid2FybiIsIlJlcXVlc3RCYXNlIiwiaXNPYmplY3QiLCJSZXNwb25zZUJhc2UiLCJ1cmwiLCJSZXF1ZXN0IiwiZ2V0WEhSIiwiWE1MSHR0cFJlcXVlc3QiLCJwcm90b2NvbCIsIkFjdGl2ZVhPYmplY3QiLCJ0cmltIiwicyIsInJlcGxhY2UiLCJzZXJpYWxpemUiLCJwYWlycyIsInB1c2hFbmNvZGVkS2V5VmFsdWVQYWlyIiwiaXNBcnJheSIsInYiLCJzdWJrZXkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJzZXJpYWxpemVPYmplY3QiLCJwYXJzZVN0cmluZyIsInN0ciIsInBhaXIiLCJwb3MiLCJkZWNvZGVVUklDb21wb25lbnQiLCJ0eXBlcyIsImpzb24iLCJ4bWwiLCJ1cmxlbmNvZGVkIiwiSlNPTiIsInN0cmluZ2lmeSIsInBhcnNlIiwicGFyc2VIZWFkZXIiLCJsaW5lcyIsImZpZWxkcyIsImluZGV4IiwibGluZSIsImZpZWxkIiwiaXNKU09OIiwibWltZSIsInRlc3QiLCJSZXNwb25zZSIsInhociIsInJlc3BvbnNlVHlwZSIsInJlc3BvbnNlVGV4dCIsInN0YXR1c1RleHQiLCJzdGF0dXMiLCJfc2V0U3RhdHVzUHJvcGVydGllcyIsImhlYWRlciIsImhlYWRlcnMiLCJnZXRBbGxSZXNwb25zZUhlYWRlcnMiLCJnZXRSZXNwb25zZUhlYWRlciIsIl9zZXRIZWFkZXJQcm9wZXJ0aWVzIiwiX3Jlc3BvbnNlVHlwZSIsImJvZHkiLCJyZXNwb25zZSIsIl9wYXJzZUJvZHkiLCJ0eXBlIiwiX3BhcnNlciIsInRvRXJyb3IiLCJfcXVlcnkiLCJfaGVhZGVyIiwib3JpZ2luYWwiLCJyYXdSZXNwb25zZSIsInN0YXR1c0NvZGUiLCJuZXdfZXJyIiwiX2lzUmVzcG9uc2VPSyIsImN1c3RvbV9lcnIiLCJzZXQiLCJhY2NlcHQiLCJhdXRoIiwidXNlciIsInBhc3MiLCJidG9hIiwiZW5jb2RlciIsInN0cmluZyIsIl9hdXRoIiwicXVlcnkiLCJhdHRhY2giLCJfZGF0YSIsIl9nZXRGb3JtRGF0YSIsImFwcGVuZCIsIl9mb3JtRGF0YSIsIkZvcm1EYXRhIiwiX3Nob3VsZFJldHJ5IiwiX3JldHJ5IiwiX2NhbGxiYWNrIiwiX21heFJldHJpZXMiLCJyZXRyaWVzIiwiX3JldHJpZXMiLCJjcm9zc0RvbWFpbkVycm9yIiwiY3Jvc3NEb21haW4iLCJjYSIsImFnZW50IiwicGlwZSIsIndyaXRlIiwiX2lzSG9zdCIsIl9lbmRDYWxsZWQiLCJfZmluYWxpemVRdWVyeVN0cmluZyIsIl9lbmQiLCJfc2V0VGltZW91dHMiLCJyZWFkeVN0YXRlIiwiX3Jlc3BvbnNlVGltZW91dFRpbWVyIiwidGltZWRvdXQiLCJfYWJvcnRlZCIsImhhbmRsZVByb2dyZXNzIiwiZGlyZWN0aW9uIiwidG90YWwiLCJwZXJjZW50IiwibG9hZGVkIiwib25wcm9ncmVzcyIsImJpbmQiLCJ1cGxvYWQiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwib3BlbiIsIl93aXRoQ3JlZGVudGlhbHMiLCJ3aXRoQ3JlZGVudGlhbHMiLCJjb250ZW50VHlwZSIsIl9zZXJpYWxpemVyIiwiaGFzT3duUHJvcGVydHkiLCJzZXRSZXF1ZXN0SGVhZGVyIiwic2VuZCIsImRlbCIsImdldCIsImhlYWQiLCJwYXRjaCIsInBvc3QiLCJwdXQiLCJfY2xlYXJUaW1lb3V0IiwiX3RpbWVyIiwiX3RpbWVvdXQiLCJfcmVzcG9uc2VUaW1lb3V0Iiwib3B0aW9uIiwiZGVhZGxpbmUiLCJyZXRyeSIsIl9yZXRyeUNhbGxiYWNrIiwiRVJST1JfQ09ERVMiLCJvdmVycmlkZSIsImVycm9yIiwiY29kZSIsIl9mdWxsZmlsbGVkUHJvbWlzZSIsImlubmVyUmVzb2x2ZSIsImlubmVyUmVqZWN0IiwidXNlIiwib2siLCJfb2tDYWxsYmFjayIsImdldEhlYWRlciIsInVuc2V0IiwiYWJvcnQiLCJiYXNlNjRFbmNvZGVyIiwicmVkaXJlY3RzIiwibiIsIl9tYXhSZWRpcmVjdHMiLCJtYXhSZXNwb25zZVNpemUiLCJfbWF4UmVzcG9uc2VTaXplIiwidG9KU09OIiwiaXNPYmoiLCJzb3J0UXVlcnkiLCJzb3J0IiwiX3NvcnQiLCJxdWVyeUFyciIsInN1YnN0cmluZyIsIl9hcHBlbmRRdWVyeVN0cmluZyIsInRyYWNlIiwiX3RpbWVvdXRFcnJvciIsInJlYXNvbiIsImVycm5vIiwidXRpbHMiLCJjdCIsInBhcmFtcyIsImxpbmtzIiwibGluayIsInBhcnNlTGlua3MiLCJzdGF0dXNUeXBlIiwiaW5mbyIsInJlZGlyZWN0IiwiY2xpZW50RXJyb3IiLCJzZXJ2ZXJFcnJvciIsImNyZWF0ZWQiLCJhY2NlcHRlZCIsIm5vQ29udGVudCIsImJhZFJlcXVlc3QiLCJ1bmF1dGhvcml6ZWQiLCJub3RBY2NlcHRhYmxlIiwiZm9yYmlkZGVuIiwibm90Rm91bmQiLCJ1bnByb2Nlc3NhYmxlRW50aXR5Iiwic2hpZnQiLCJyZWR1Y2UiLCJwYXJ0cyIsInJlbCIsImNsZWFuSGVhZGVyIiwiY2hhbmdlc09yaWdpbiIsInNjb3BlIiwiVGltZW91dCIsInNldEludGVydmFsIiwiY2xlYXJJbnRlcnZhbCIsImNsb3NlIiwiaWQiLCJjbGVhckZuIiwiX2lkIiwiX2NsZWFyRm4iLCJ1bnJlZiIsInJlZiIsImVucm9sbCIsIm1zZWNzIiwiX2lkbGVUaW1lb3V0SWQiLCJfaWRsZVRpbWVvdXQiLCJ1bmVucm9sbCIsIl91bnJlZkFjdGl2ZSIsImFjdGl2ZSIsIm9uVGltZW91dCIsIl9vblRpbWVvdXQiLCJnIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNB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QUNoQzs7QUFFRDtBQUNBO0FBQ0E7O0FBRUFXLE9BQU9DLE9BQVAsR0FBaUJvYixDQUFqQixDIiwiZmlsZSI6InBhdGgtbG9hZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IFwiLi9pbmRleC5qc1wiKTtcbiIsIi8qXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgSmVyZW15IFdoaXRsb2NrXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzdXBwb3J0ZWRMb2FkZXJzID0ge1xuICBmaWxlOiByZXF1aXJlKCcuL2xpYi9sb2FkZXJzL2ZpbGUnKSxcbiAgaHR0cDogcmVxdWlyZSgnLi9saWIvbG9hZGVycy9odHRwJyksXG4gIGh0dHBzOiByZXF1aXJlKCcuL2xpYi9sb2FkZXJzL2h0dHAnKVxufTtcbnZhciBkZWZhdWx0TG9hZGVyID0gdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIGltcG9ydFNjcmlwdHMgPT09ICdmdW5jdGlvbicgP1xuICAgICAgc3VwcG9ydGVkTG9hZGVycy5odHRwIDpcbiAgICAgIHN1cHBvcnRlZExvYWRlcnMuZmlsZTtcblxuLy8gTG9hZCBwcm9taXNlcyBwb2x5ZmlsbCBpZiBuZWNlc3Nhcnlcbi8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuaWYgKHR5cGVvZiBQcm9taXNlID09PSAndW5kZWZpbmVkJykge1xuICByZXF1aXJlKCduYXRpdmUtcHJvbWlzZS1vbmx5Jyk7XG59XG5cbmZ1bmN0aW9uIGdldFNjaGVtZSAobG9jYXRpb24pIHtcbiAgaWYgKHR5cGVvZiBsb2NhdGlvbiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBsb2NhdGlvbiA9IGxvY2F0aW9uLmluZGV4T2YoJzovLycpID09PSAtMSA/ICcnIDogbG9jYXRpb24uc3BsaXQoJzovLycpWzBdO1xuICB9XG5cbiAgcmV0dXJuIGxvY2F0aW9uO1xufVxuXG4vKipcbiAqIFV0aWxpdHkgdGhhdCBwcm92aWRlcyBhIHNpbmdsZSBBUEkgZm9yIGxvYWRpbmcgdGhlIGNvbnRlbnQgb2YgYSBwYXRoL1VSTC5cbiAqXG4gKiBAbW9kdWxlIHBhdGgtbG9hZGVyXG4gKi9cblxuZnVuY3Rpb24gZ2V0TG9hZGVyIChsb2NhdGlvbikge1xuICB2YXIgc2NoZW1lID0gZ2V0U2NoZW1lKGxvY2F0aW9uKTtcbiAgdmFyIGxvYWRlciA9IHN1cHBvcnRlZExvYWRlcnNbc2NoZW1lXTtcblxuICBpZiAodHlwZW9mIGxvYWRlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoc2NoZW1lID09PSAnJykge1xuICAgICAgbG9hZGVyID0gZGVmYXVsdExvYWRlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBzY2hlbWU6ICcgKyBzY2hlbWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsb2FkZXI7XG59XG5cbi8qKlxuICogTG9hZHMgYSBkb2N1bWVudCBhdCB0aGUgcHJvdmlkZWQgbG9jYXRpb24gYW5kIHJldHVybnMgYSBKYXZhU2NyaXB0IG9iamVjdCByZXByZXNlbnRhdGlvbi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbG9jYXRpb24gLSBUaGUgbG9jYXRpb24gdG8gdGhlIGRvY3VtZW50XG4gKiBAcGFyYW0ge21vZHVsZTpwYXRoLWxvYWRlci5Mb2FkT3B0aW9uc30gW29wdGlvbnNdIC0gVGhlIGxvYWRlciBvcHRpb25zXG4gKlxuICogQHJldHVybnMge1Byb21pc2U8Kj59IEFsd2F5cyByZXR1cm5zIGEgcHJvbWlzZSBldmVuIGlmIHRoZXJlIGlzIGEgY2FsbGJhY2sgcHJvdmlkZWRcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gRXhhbXBsZSB1c2luZyBQcm9taXNlc1xuICpcbiAqIFBhdGhMb2FkZXJcbiAqICAgLmxvYWQoJy4vcGFja2FnZS5qc29uJylcbiAqICAgLnRoZW4oSlNPTi5wYXJzZSlcbiAqICAgLnRoZW4oZnVuY3Rpb24gKGRvY3VtZW50KSB7XG4gKiAgICAgY29uc29sZS5sb2coZG9jdW1lbnQubmFtZSArICcgKCcgKyBkb2N1bWVudC52ZXJzaW9uICsgJyk6ICcgKyBkb2N1bWVudC5kZXNjcmlwdGlvbik7XG4gKiAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAqICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gKiAgIH0pO1xuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBFeGFtcGxlIHVzaW5nIG9wdGlvbnMucHJlcGFyZVJlcXVlc3QgdG8gcHJvdmlkZSBhdXRoZW50aWNhdGlvbiBkZXRhaWxzIGZvciBhIHJlbW90ZWx5IHNlY3VyZSBVUkxcbiAqXG4gKiBQYXRoTG9hZGVyXG4gKiAgIC5sb2FkKCdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL3doaXRsb2NramMvcGF0aC1sb2FkZXInLCB7XG4gKiAgICAgcHJlcGFyZVJlcXVlc3Q6IGZ1bmN0aW9uIChyZXEsIGNhbGxiYWNrKSB7XG4gKiAgICAgICByZXEuYXV0aCgnbXktdXNlcm5hbWUnLCAnbXktcGFzc3dvcmQnKTtcbiAqICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgcmVxKTtcbiAqICAgICB9XG4gKiAgIH0pXG4gKiAgIC50aGVuKEpTT04ucGFyc2UpXG4gKiAgIC50aGVuKGZ1bmN0aW9uIChkb2N1bWVudCkge1xuICogICAgIGNvbnNvbGUubG9nKGRvY3VtZW50LmZ1bGxfbmFtZSArICc6ICcgKyBkb2N1bWVudC5kZXNjcmlwdGlvbik7XG4gKiAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAqICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gKiAgIH0pO1xuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBFeGFtcGxlIGxvYWRpbmcgYSBZQU1MIGZpbGVcbiAqXG4gKiBQYXRoTG9hZGVyXG4gKiAgIC5sb2FkKCcvVXNlcnMvbm90LXlvdS9wcm9qZWN0cy9wYXRoLWxvYWRlci8udHJhdmlzLnltbCcpXG4gKiAgIC50aGVuKFlBTUwuc2FmZUxvYWQpXG4gKiAgIC50aGVuKGZ1bmN0aW9uIChkb2N1bWVudCkge1xuICogICAgIGNvbnNvbGUubG9nKCdwYXRoLWxvYWRlciB1c2VzIHRoZScsIGRvY3VtZW50Lmxhbmd1YWdlLCAnbGFuZ3VhZ2UuJyk7XG4gKiAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAqICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gKiAgIH0pO1xuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBFeGFtcGxlIGxvYWRpbmcgYSBZQU1MIGZpbGUgd2l0aCBvcHRpb25zLnByb2Nlc3NDb250ZW50IChVc2VmdWwgaWYgeW91IG5lZWQgaW5mb3JtYXRpb24gaW4gdGhlIHJhdyByZXNwb25zZSlcbiAqXG4gKiBQYXRoTG9hZGVyXG4gKiAgIC5sb2FkKCcvVXNlcnMvbm90LXlvdS9wcm9qZWN0cy9wYXRoLWxvYWRlci8udHJhdmlzLnltbCcsIHtcbiAqICAgICBwcm9jZXNzQ29udGVudDogZnVuY3Rpb24gKHJlcywgY2FsbGJhY2spIHtcbiAqICAgICAgIGNhbGxiYWNrKFlBTUwuc2FmZUxvYWQocmVzLnRleHQpKTtcbiAqICAgICB9XG4gKiAgIH0pXG4gKiAgIC50aGVuKGZ1bmN0aW9uIChkb2N1bWVudCkge1xuICogICAgIGNvbnNvbGUubG9nKCdwYXRoLWxvYWRlciB1c2VzIHRoZScsIGRvY3VtZW50Lmxhbmd1YWdlLCAnbGFuZ3VhZ2UuJyk7XG4gKiAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAqICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gKiAgIH0pO1xuICovXG5tb2R1bGUuZXhwb3J0cy5sb2FkID0gZnVuY3Rpb24gKGxvY2F0aW9uLCBvcHRpb25zKSB7XG4gIHZhciBhbGxUYXNrcyA9IFByb21pc2UucmVzb2x2ZSgpO1xuXG4gIC8vIERlZmF1bHQgb3B0aW9ucyB0byBlbXB0eSBvYmplY3RcbiAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAndW5kZWZpbmVkJykge1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuXG4gIC8vIFZhbGlkYXRlIGFyZ3VtZW50c1xuICBhbGxUYXNrcyA9IGFsbFRhc2tzLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgIGlmICh0eXBlb2YgbG9jYXRpb24gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdsb2NhdGlvbiBpcyByZXF1aXJlZCcpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGxvY2F0aW9uICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbG9jYXRpb24gbXVzdCBiZSBhIHN0cmluZycpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9ucyBtdXN0IGJlIGFuIG9iamVjdCcpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucy5wcm9jZXNzQ29udGVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG9wdGlvbnMucHJvY2Vzc0NvbnRlbnQgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9ucy5wcm9jZXNzQ29udGVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIC8vIExvYWQgdGhlIGRvY3VtZW50IGZyb20gdGhlIHByb3ZpZGVkIGxvY2F0aW9uIGFuZCBwcm9jZXNzIGl0XG4gIGFsbFRhc2tzID0gYWxsVGFza3NcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgbG9hZGVyID0gZ2V0TG9hZGVyKGxvY2F0aW9uKTtcblxuICAgICAgICBsb2FkZXIubG9hZChsb2NhdGlvbiwgb3B0aW9ucyB8fCB7fSwgZnVuY3Rpb24gKGVyciwgZG9jdW1lbnQpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZShkb2N1bWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgaWYgKG9wdGlvbnMucHJvY2Vzc0NvbnRlbnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAvLyBGb3IgY29uc2lzdGVuY3kgYmV0d2VlbiBmaWxlIGFuZCBodHRwLCBhbHdheXMgc2VuZCBhbiBvYmplY3Qgd2l0aCBhICd0ZXh0JyBwcm9wZXJ0eSBjb250YWluaW5nIHRoZSByYXdcbiAgICAgICAgICAvLyBzdHJpbmcgdmFsdWUgYmVpbmcgcHJvY2Vzc2VkLlxuICAgICAgICAgIG9wdGlvbnMucHJvY2Vzc0NvbnRlbnQodHlwZW9mIHJlcyA9PT0gJ29iamVjdCcgPyByZXMgOiB7dGV4dDogcmVzfSwgZnVuY3Rpb24gKGVyciwgcHJvY2Vzc2VkKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZShwcm9jZXNzZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElmIHRoZXJlIHdhcyBubyBjb250ZW50IHByb2Nlc3Nvciwgd2Ugd2lsbCBhc3N1bWUgdGhhdCBmb3IgYWxsIG9iamVjdHMgdGhhdCBpdCBpcyBhIFN1cGVyYWdlbnQgcmVzcG9uc2VcbiAgICAgICAgLy8gYW5kIHdpbGwgcmV0dXJuIGl0cyBgdGV4dGAgcHJvcGVydHkgdmFsdWUuICBPdGhlcndpc2UsIHdlIHdpbGwgcmV0dXJuIHRoZSByYXcgcmVzcG9uc2UuXG4gICAgICAgIHJldHVybiB0eXBlb2YgcmVzID09PSAnb2JqZWN0JyA/IHJlcy50ZXh0IDogcmVzO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIHJldHVybiBhbGxUYXNrcztcbn07XG4iLCIvKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEplcmVteSBXaGl0bG9ja1xuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdW5zdXBwb3J0ZWRFcnJvciA9IG5ldyBUeXBlRXJyb3IoJ1RoZSBcXCdmaWxlXFwnIHNjaGVtZSBpcyBub3Qgc3VwcG9ydGVkIGluIHRoZSBicm93c2VyJyk7XG5cbi8qKlxuICogVGhlIGZpbGUgbG9hZGVyIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhlIGJyb3dzZXIuXG4gKlxuICogQHRocm93cyB7ZXJyb3J9IHRoZSBmaWxlIGxvYWRlciBpcyBub3Qgc3VwcG9ydGVkIGluIHRoZSBicm93c2VyXG4gKi9cbm1vZHVsZS5leHBvcnRzLmdldEJhc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHRocm93IHVuc3VwcG9ydGVkRXJyb3I7XG59O1xuXG4vKipcbiAqIFRoZSBmaWxlIGxvYWRlciBpcyBub3Qgc3VwcG9ydGVkIGluIHRoZSBicm93c2VyLlxuICovXG5tb2R1bGUuZXhwb3J0cy5sb2FkID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZm4gPSBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdO1xuXG4gIGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICBmbih1bnN1cHBvcnRlZEVycm9yKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyB1bnN1cHBvcnRlZEVycm9yO1xuICB9XG59O1xuIiwiLyogZXNsaW50LWVudiBub2RlLCBicm93c2VyICovXG5cbi8qXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgSmVyZW15IFdoaXRsb2NrXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciByZXF1ZXN0ID0gcmVxdWlyZSgnc3VwZXJhZ2VudCcpO1xuXG52YXIgc3VwcG9ydGVkSHR0cE1ldGhvZHMgPSBbJ2RlbGV0ZScsICdnZXQnLCAnaGVhZCcsICdwYXRjaCcsICdwb3N0JywgJ3B1dCddO1xuXG4vKipcbiAqIExvYWRzIGEgZmlsZSBmcm9tIGFuIGh0dHAgb3IgaHR0cHMgVVJMLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBsb2NhdGlvbiAtIFRoZSBkb2N1bWVudCBVUkwgKElmIHJlbGF0aXZlLCBsb2NhdGlvbiBpcyByZWxhdGl2ZSB0byB3aW5kb3cubG9jYXRpb24ub3JpZ2luKS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIC0gVGhlIGxvYWRlciBvcHRpb25zXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMubWV0aG9kPWdldF0gLSBUaGUgSFRUUCBtZXRob2QgdG8gdXNlIGZvciB0aGUgcmVxdWVzdFxuICogQHBhcmFtIHttb2R1bGU6UGF0aExvYWRlcn5QcmVwYXJlUmVxdWVzdENhbGxiYWNrfSBbb3B0aW9ucy5wcmVwYXJlUmVxdWVzdF0gLSBUaGUgY2FsbGJhY2sgdXNlZCB0byBwcmVwYXJlIGEgcmVxdWVzdFxuICogQHBhcmFtIHttb2R1bGU6UGF0aExvYWRlcn5Qcm9jZXNzUmVzcG9uc2VDYWxsYmFja30gW29wdGlvbnMucHJvY2Vzc0NvbnRlbnRdIC0gVGhlIGNhbGxiYWNrIHVzZWQgdG8gcHJvY2VzcyB0aGVcbiAqIHJlc3BvbnNlXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIFRoZSBlcnJvci1maXJzdCBjYWxsYmFja1xuICovXG5tb2R1bGUuZXhwb3J0cy5sb2FkID0gZnVuY3Rpb24gKGxvY2F0aW9uLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICB2YXIgcmVhbE1ldGhvZCA9IG9wdGlvbnMubWV0aG9kID8gb3B0aW9ucy5tZXRob2QudG9Mb3dlckNhc2UoKSA6ICdnZXQnO1xuICB2YXIgZXJyO1xuICB2YXIgcmVhbFJlcXVlc3Q7XG5cbiAgZnVuY3Rpb24gbWFrZVJlcXVlc3QgKGVyciwgcmVxKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gYnVmZmVyKCkgaXMgb25seSBhdmFpbGFibGUgaW4gTm9kZS5qc1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9jZXNzIDogMCkgPT09ICdbb2JqZWN0IHByb2Nlc3NdJyAmJlxuICAgICAgICAgIHR5cGVvZiByZXEuYnVmZmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJlcS5idWZmZXIodHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIHJlcVxuICAgICAgICAuZW5kKGZ1bmN0aW9uIChlcnIyLCByZXMpIHtcbiAgICAgICAgICBpZiAoZXJyMikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyMik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgcmVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5tZXRob2QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLm1ldGhvZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGVyciA9IG5ldyBUeXBlRXJyb3IoJ29wdGlvbnMubWV0aG9kIG11c3QgYmUgYSBzdHJpbmcnKTtcbiAgICB9IGVsc2UgaWYgKHN1cHBvcnRlZEh0dHBNZXRob2RzLmluZGV4T2Yob3B0aW9ucy5tZXRob2QpID09PSAtMSkge1xuICAgICAgZXJyID0gbmV3IFR5cGVFcnJvcignb3B0aW9ucy5tZXRob2QgbXVzdCBiZSBvbmUgb2YgdGhlIGZvbGxvd2luZzogJyArXG4gICAgICAgIHN1cHBvcnRlZEh0dHBNZXRob2RzLnNsaWNlKDAsIHN1cHBvcnRlZEh0dHBNZXRob2RzLmxlbmd0aCAtIDEpLmpvaW4oJywgJykgKyAnIG9yICcgK1xuICAgICAgICBzdXBwb3J0ZWRIdHRwTWV0aG9kc1tzdXBwb3J0ZWRIdHRwTWV0aG9kcy5sZW5ndGggLSAxXSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLnByZXBhcmVSZXF1ZXN0ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygb3B0aW9ucy5wcmVwYXJlUmVxdWVzdCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIGVyciA9IG5ldyBUeXBlRXJyb3IoJ29wdGlvbnMucHJlcGFyZVJlcXVlc3QgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAoIWVycikge1xuICAgIHJlYWxSZXF1ZXN0ID0gcmVxdWVzdFtyZWFsTWV0aG9kID09PSAnZGVsZXRlJyA/ICdkZWwnIDogcmVhbE1ldGhvZF0obG9jYXRpb24pO1xuXG4gICAgaWYgKG9wdGlvbnMucHJlcGFyZVJlcXVlc3QpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG9wdGlvbnMucHJlcGFyZVJlcXVlc3QocmVhbFJlcXVlc3QsIG1ha2VSZXF1ZXN0KTtcbiAgICAgIH0gY2F0Y2ggKGVycjIpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyMik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG1ha2VSZXF1ZXN0KHVuZGVmaW5lZCwgcmVhbFJlcXVlc3QpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjYWxsYmFjayhlcnIpO1xuICB9XG59O1xuIiwiXHJcbi8qKlxyXG4gKiBFeHBvc2UgYEVtaXR0ZXJgLlxyXG4gKi9cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xyXG4gIG1vZHVsZS5leHBvcnRzID0gRW1pdHRlcjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEluaXRpYWxpemUgYSBuZXcgYEVtaXR0ZXJgLlxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIEVtaXR0ZXIob2JqKSB7XHJcbiAgaWYgKG9iaikgcmV0dXJuIG1peGluKG9iaik7XHJcbn07XHJcblxyXG4vKipcclxuICogTWl4aW4gdGhlIGVtaXR0ZXIgcHJvcGVydGllcy5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IG9ialxyXG4gKiBAcmV0dXJuIHtPYmplY3R9XHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIG1peGluKG9iaikge1xyXG4gIGZvciAodmFyIGtleSBpbiBFbWl0dGVyLnByb3RvdHlwZSkge1xyXG4gICAgb2JqW2tleV0gPSBFbWl0dGVyLnByb3RvdHlwZVtrZXldO1xyXG4gIH1cclxuICByZXR1cm4gb2JqO1xyXG59XHJcblxyXG4vKipcclxuICogTGlzdGVuIG9uIHRoZSBnaXZlbiBgZXZlbnRgIHdpdGggYGZuYC5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXHJcbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuRW1pdHRlci5wcm90b3R5cGUub24gPVxyXG5FbWl0dGVyLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcclxuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XHJcbiAgKHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF0gPSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdIHx8IFtdKVxyXG4gICAgLnB1c2goZm4pO1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYW4gYGV2ZW50YCBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgaW52b2tlZCBhIHNpbmdsZVxyXG4gKiB0aW1lIHRoZW4gYXV0b21hdGljYWxseSByZW1vdmVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cclxuICogQHJldHVybiB7RW1pdHRlcn1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5FbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcclxuICBmdW5jdGlvbiBvbigpIHtcclxuICAgIHRoaXMub2ZmKGV2ZW50LCBvbik7XHJcbiAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gIH1cclxuXHJcbiAgb24uZm4gPSBmbjtcclxuICB0aGlzLm9uKGV2ZW50LCBvbik7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlIHRoZSBnaXZlbiBjYWxsYmFjayBmb3IgYGV2ZW50YCBvciBhbGxcclxuICogcmVnaXN0ZXJlZCBjYWxsYmFja3MuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxyXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbkVtaXR0ZXIucHJvdG90eXBlLm9mZiA9XHJcbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID1cclxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID1cclxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XHJcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xyXG5cclxuICAvLyBhbGxcclxuICBpZiAoMCA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICB0aGlzLl9jYWxsYmFja3MgPSB7fTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLy8gc3BlY2lmaWMgZXZlbnRcclxuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcclxuICBpZiAoIWNhbGxiYWNrcykgcmV0dXJuIHRoaXM7XHJcblxyXG4gIC8vIHJlbW92ZSBhbGwgaGFuZGxlcnNcclxuICBpZiAoMSA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgLy8gcmVtb3ZlIHNwZWNpZmljIGhhbmRsZXJcclxuICB2YXIgY2I7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcclxuICAgIGNiID0gY2FsbGJhY2tzW2ldO1xyXG4gICAgaWYgKGNiID09PSBmbiB8fCBjYi5mbiA9PT0gZm4pIHtcclxuICAgICAgY2FsbGJhY2tzLnNwbGljZShpLCAxKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVtaXQgYGV2ZW50YCB3aXRoIHRoZSBnaXZlbiBhcmdzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcclxuICogQHBhcmFtIHtNaXhlZH0gLi4uXHJcbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XHJcbiAqL1xyXG5cclxuRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XHJcbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcclxuICAgICwgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcclxuXHJcbiAgaWYgKGNhbGxiYWNrcykge1xyXG4gICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLnNsaWNlKDApO1xyXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNhbGxiYWNrcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xyXG4gICAgICBjYWxsYmFja3NbaV0uYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gYXJyYXkgb2YgY2FsbGJhY2tzIGZvciBgZXZlbnRgLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcclxuICogQHJldHVybiB7QXJyYXl9XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuRW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcclxuICByZXR1cm4gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XSB8fCBbXTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDaGVjayBpZiB0aGlzIGVtaXR0ZXIgaGFzIGBldmVudGAgaGFuZGxlcnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxyXG4gKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbkVtaXR0ZXIucHJvdG90eXBlLmhhc0xpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuICByZXR1cm4gISEgdGhpcy5saXN0ZW5lcnMoZXZlbnQpLmxlbmd0aDtcclxufTtcclxuIiwiLyohIE5hdGl2ZSBQcm9taXNlIE9ubHlcbiAgICB2MC44LjEgKGMpIEt5bGUgU2ltcHNvblxuICAgIE1JVCBMaWNlbnNlOiBodHRwOi8vZ2V0aWZ5Lm1pdC1saWNlbnNlLm9yZ1xuKi9cblxuKGZ1bmN0aW9uIFVNRChuYW1lLGNvbnRleHQsZGVmaW5pdGlvbil7XG5cdC8vIHNwZWNpYWwgZm9ybSBvZiBVTUQgZm9yIHBvbHlmaWxsaW5nIGFjcm9zcyBldmlyb25tZW50c1xuXHRjb250ZXh0W25hbWVdID0gY29udGV4dFtuYW1lXSB8fCBkZWZpbml0aW9uKCk7XG5cdGlmICh0eXBlb2YgbW9kdWxlICE9IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHsgbW9kdWxlLmV4cG9ydHMgPSBjb250ZXh0W25hbWVdOyB9XG5cdGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHsgZGVmaW5lKGZ1bmN0aW9uICRBTUQkKCl7IHJldHVybiBjb250ZXh0W25hbWVdOyB9KTsgfVxufSkoXCJQcm9taXNlXCIsdHlwZW9mIGdsb2JhbCAhPSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdGhpcyxmdW5jdGlvbiBERUYoKXtcblx0Lypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIGJ1aWx0SW5Qcm9wLCBjeWNsZSwgc2NoZWR1bGluZ19xdWV1ZSxcblx0XHRUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG5cdFx0dGltZXIgPSAodHlwZW9mIHNldEltbWVkaWF0ZSAhPSBcInVuZGVmaW5lZFwiKSA/XG5cdFx0XHRmdW5jdGlvbiB0aW1lcihmbikgeyByZXR1cm4gc2V0SW1tZWRpYXRlKGZuKTsgfSA6XG5cdFx0XHRzZXRUaW1lb3V0XG5cdDtcblxuXHQvLyBkYW1taXQsIElFOC5cblx0dHJ5IHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoe30sXCJ4XCIse30pO1xuXHRcdGJ1aWx0SW5Qcm9wID0gZnVuY3Rpb24gYnVpbHRJblByb3Aob2JqLG5hbWUsdmFsLGNvbmZpZykge1xuXHRcdFx0cmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosbmFtZSx7XG5cdFx0XHRcdHZhbHVlOiB2YWwsXG5cdFx0XHRcdHdyaXRhYmxlOiB0cnVlLFxuXHRcdFx0XHRjb25maWd1cmFibGU6IGNvbmZpZyAhPT0gZmFsc2Vcblx0XHRcdH0pO1xuXHRcdH07XG5cdH1cblx0Y2F0Y2ggKGVycikge1xuXHRcdGJ1aWx0SW5Qcm9wID0gZnVuY3Rpb24gYnVpbHRJblByb3Aob2JqLG5hbWUsdmFsKSB7XG5cdFx0XHRvYmpbbmFtZV0gPSB2YWw7XG5cdFx0XHRyZXR1cm4gb2JqO1xuXHRcdH07XG5cdH1cblxuXHQvLyBOb3RlOiB1c2luZyBhIHF1ZXVlIGluc3RlYWQgb2YgYXJyYXkgZm9yIGVmZmljaWVuY3lcblx0c2NoZWR1bGluZ19xdWV1ZSA9IChmdW5jdGlvbiBRdWV1ZSgpIHtcblx0XHR2YXIgZmlyc3QsIGxhc3QsIGl0ZW07XG5cblx0XHRmdW5jdGlvbiBJdGVtKGZuLHNlbGYpIHtcblx0XHRcdHRoaXMuZm4gPSBmbjtcblx0XHRcdHRoaXMuc2VsZiA9IHNlbGY7XG5cdFx0XHR0aGlzLm5leHQgPSB2b2lkIDA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGFkZDogZnVuY3Rpb24gYWRkKGZuLHNlbGYpIHtcblx0XHRcdFx0aXRlbSA9IG5ldyBJdGVtKGZuLHNlbGYpO1xuXHRcdFx0XHRpZiAobGFzdCkge1xuXHRcdFx0XHRcdGxhc3QubmV4dCA9IGl0ZW07XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0Zmlyc3QgPSBpdGVtO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGxhc3QgPSBpdGVtO1xuXHRcdFx0XHRpdGVtID0gdm9pZCAwO1xuXHRcdFx0fSxcblx0XHRcdGRyYWluOiBmdW5jdGlvbiBkcmFpbigpIHtcblx0XHRcdFx0dmFyIGYgPSBmaXJzdDtcblx0XHRcdFx0Zmlyc3QgPSBsYXN0ID0gY3ljbGUgPSB2b2lkIDA7XG5cblx0XHRcdFx0d2hpbGUgKGYpIHtcblx0XHRcdFx0XHRmLmZuLmNhbGwoZi5zZWxmKTtcblx0XHRcdFx0XHRmID0gZi5uZXh0O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fSkoKTtcblxuXHRmdW5jdGlvbiBzY2hlZHVsZShmbixzZWxmKSB7XG5cdFx0c2NoZWR1bGluZ19xdWV1ZS5hZGQoZm4sc2VsZik7XG5cdFx0aWYgKCFjeWNsZSkge1xuXHRcdFx0Y3ljbGUgPSB0aW1lcihzY2hlZHVsaW5nX3F1ZXVlLmRyYWluKTtcblx0XHR9XG5cdH1cblxuXHQvLyBwcm9taXNlIGR1Y2sgdHlwaW5nXG5cdGZ1bmN0aW9uIGlzVGhlbmFibGUobykge1xuXHRcdHZhciBfdGhlbiwgb190eXBlID0gdHlwZW9mIG87XG5cblx0XHRpZiAobyAhPSBudWxsICYmXG5cdFx0XHQoXG5cdFx0XHRcdG9fdHlwZSA9PSBcIm9iamVjdFwiIHx8IG9fdHlwZSA9PSBcImZ1bmN0aW9uXCJcblx0XHRcdClcblx0XHQpIHtcblx0XHRcdF90aGVuID0gby50aGVuO1xuXHRcdH1cblx0XHRyZXR1cm4gdHlwZW9mIF90aGVuID09IFwiZnVuY3Rpb25cIiA/IF90aGVuIDogZmFsc2U7XG5cdH1cblxuXHRmdW5jdGlvbiBub3RpZnkoKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuY2hhaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdG5vdGlmeUlzb2xhdGVkKFxuXHRcdFx0XHR0aGlzLFxuXHRcdFx0XHQodGhpcy5zdGF0ZSA9PT0gMSkgPyB0aGlzLmNoYWluW2ldLnN1Y2Nlc3MgOiB0aGlzLmNoYWluW2ldLmZhaWx1cmUsXG5cdFx0XHRcdHRoaXMuY2hhaW5baV1cblx0XHRcdCk7XG5cdFx0fVxuXHRcdHRoaXMuY2hhaW4ubGVuZ3RoID0gMDtcblx0fVxuXG5cdC8vIE5PVEU6IFRoaXMgaXMgYSBzZXBhcmF0ZSBmdW5jdGlvbiB0byBpc29sYXRlXG5cdC8vIHRoZSBgdHJ5Li5jYXRjaGAgc28gdGhhdCBvdGhlciBjb2RlIGNhbiBiZVxuXHQvLyBvcHRpbWl6ZWQgYmV0dGVyXG5cdGZ1bmN0aW9uIG5vdGlmeUlzb2xhdGVkKHNlbGYsY2IsY2hhaW4pIHtcblx0XHR2YXIgcmV0LCBfdGhlbjtcblx0XHR0cnkge1xuXHRcdFx0aWYgKGNiID09PSBmYWxzZSkge1xuXHRcdFx0XHRjaGFpbi5yZWplY3Qoc2VsZi5tc2cpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGlmIChjYiA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdHJldCA9IHNlbGYubXNnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdHJldCA9IGNiLmNhbGwodm9pZCAwLHNlbGYubXNnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyZXQgPT09IGNoYWluLnByb21pc2UpIHtcblx0XHRcdFx0XHRjaGFpbi5yZWplY3QoVHlwZUVycm9yKFwiUHJvbWlzZS1jaGFpbiBjeWNsZVwiKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoX3RoZW4gPSBpc1RoZW5hYmxlKHJldCkpIHtcblx0XHRcdFx0XHRfdGhlbi5jYWxsKHJldCxjaGFpbi5yZXNvbHZlLGNoYWluLnJlamVjdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0Y2hhaW4ucmVzb2x2ZShyZXQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGNhdGNoIChlcnIpIHtcblx0XHRcdGNoYWluLnJlamVjdChlcnIpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHJlc29sdmUobXNnKSB7XG5cdFx0dmFyIF90aGVuLCBzZWxmID0gdGhpcztcblxuXHRcdC8vIGFscmVhZHkgdHJpZ2dlcmVkP1xuXHRcdGlmIChzZWxmLnRyaWdnZXJlZCkgeyByZXR1cm47IH1cblxuXHRcdHNlbGYudHJpZ2dlcmVkID0gdHJ1ZTtcblxuXHRcdC8vIHVud3JhcFxuXHRcdGlmIChzZWxmLmRlZikge1xuXHRcdFx0c2VsZiA9IHNlbGYuZGVmO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRpZiAoX3RoZW4gPSBpc1RoZW5hYmxlKG1zZykpIHtcblx0XHRcdFx0c2NoZWR1bGUoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHR2YXIgZGVmX3dyYXBwZXIgPSBuZXcgTWFrZURlZldyYXBwZXIoc2VsZik7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdF90aGVuLmNhbGwobXNnLFxuXHRcdFx0XHRcdFx0XHRmdW5jdGlvbiAkcmVzb2x2ZSQoKXsgcmVzb2x2ZS5hcHBseShkZWZfd3JhcHBlcixhcmd1bWVudHMpOyB9LFxuXHRcdFx0XHRcdFx0XHRmdW5jdGlvbiAkcmVqZWN0JCgpeyByZWplY3QuYXBwbHkoZGVmX3dyYXBwZXIsYXJndW1lbnRzKTsgfVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Y2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdFx0cmVqZWN0LmNhbGwoZGVmX3dyYXBwZXIsZXJyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0c2VsZi5tc2cgPSBtc2c7XG5cdFx0XHRcdHNlbGYuc3RhdGUgPSAxO1xuXHRcdFx0XHRpZiAoc2VsZi5jaGFpbi5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0c2NoZWR1bGUobm90aWZ5LHNlbGYpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGNhdGNoIChlcnIpIHtcblx0XHRcdHJlamVjdC5jYWxsKG5ldyBNYWtlRGVmV3JhcHBlcihzZWxmKSxlcnIpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHJlamVjdChtc2cpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHQvLyBhbHJlYWR5IHRyaWdnZXJlZD9cblx0XHRpZiAoc2VsZi50cmlnZ2VyZWQpIHsgcmV0dXJuOyB9XG5cblx0XHRzZWxmLnRyaWdnZXJlZCA9IHRydWU7XG5cblx0XHQvLyB1bndyYXBcblx0XHRpZiAoc2VsZi5kZWYpIHtcblx0XHRcdHNlbGYgPSBzZWxmLmRlZjtcblx0XHR9XG5cblx0XHRzZWxmLm1zZyA9IG1zZztcblx0XHRzZWxmLnN0YXRlID0gMjtcblx0XHRpZiAoc2VsZi5jaGFpbi5sZW5ndGggPiAwKSB7XG5cdFx0XHRzY2hlZHVsZShub3RpZnksc2VsZik7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaXRlcmF0ZVByb21pc2VzKENvbnN0cnVjdG9yLGFycixyZXNvbHZlcixyZWplY3Rlcikge1xuXHRcdGZvciAodmFyIGlkeD0wOyBpZHg8YXJyLmxlbmd0aDsgaWR4KyspIHtcblx0XHRcdChmdW5jdGlvbiBJSUZFKGlkeCl7XG5cdFx0XHRcdENvbnN0cnVjdG9yLnJlc29sdmUoYXJyW2lkeF0pXG5cdFx0XHRcdC50aGVuKFxuXHRcdFx0XHRcdGZ1bmN0aW9uICRyZXNvbHZlciQobXNnKXtcblx0XHRcdFx0XHRcdHJlc29sdmVyKGlkeCxtc2cpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0cmVqZWN0ZXJcblx0XHRcdFx0KTtcblx0XHRcdH0pKGlkeCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gTWFrZURlZldyYXBwZXIoc2VsZikge1xuXHRcdHRoaXMuZGVmID0gc2VsZjtcblx0XHR0aGlzLnRyaWdnZXJlZCA9IGZhbHNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gTWFrZURlZihzZWxmKSB7XG5cdFx0dGhpcy5wcm9taXNlID0gc2VsZjtcblx0XHR0aGlzLnN0YXRlID0gMDtcblx0XHR0aGlzLnRyaWdnZXJlZCA9IGZhbHNlO1xuXHRcdHRoaXMuY2hhaW4gPSBbXTtcblx0XHR0aGlzLm1zZyA9IHZvaWQgMDtcblx0fVxuXG5cdGZ1bmN0aW9uIFByb21pc2UoZXhlY3V0b3IpIHtcblx0XHRpZiAodHlwZW9mIGV4ZWN1dG9yICE9IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0dGhyb3cgVHlwZUVycm9yKFwiTm90IGEgZnVuY3Rpb25cIik7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuX19OUE9fXyAhPT0gMCkge1xuXHRcdFx0dGhyb3cgVHlwZUVycm9yKFwiTm90IGEgcHJvbWlzZVwiKTtcblx0XHR9XG5cblx0XHQvLyBpbnN0YW5jZSBzaGFkb3dpbmcgdGhlIGluaGVyaXRlZCBcImJyYW5kXCJcblx0XHQvLyB0byBzaWduYWwgYW4gYWxyZWFkeSBcImluaXRpYWxpemVkXCIgcHJvbWlzZVxuXHRcdHRoaXMuX19OUE9fXyA9IDE7XG5cblx0XHR2YXIgZGVmID0gbmV3IE1ha2VEZWYodGhpcyk7XG5cblx0XHR0aGlzW1widGhlblwiXSA9IGZ1bmN0aW9uIHRoZW4oc3VjY2VzcyxmYWlsdXJlKSB7XG5cdFx0XHR2YXIgbyA9IHtcblx0XHRcdFx0c3VjY2VzczogdHlwZW9mIHN1Y2Nlc3MgPT0gXCJmdW5jdGlvblwiID8gc3VjY2VzcyA6IHRydWUsXG5cdFx0XHRcdGZhaWx1cmU6IHR5cGVvZiBmYWlsdXJlID09IFwiZnVuY3Rpb25cIiA/IGZhaWx1cmUgOiBmYWxzZVxuXHRcdFx0fTtcblx0XHRcdC8vIE5vdGU6IGB0aGVuKC4uKWAgaXRzZWxmIGNhbiBiZSBib3Jyb3dlZCB0byBiZSB1c2VkIGFnYWluc3Rcblx0XHRcdC8vIGEgZGlmZmVyZW50IHByb21pc2UgY29uc3RydWN0b3IgZm9yIG1ha2luZyB0aGUgY2hhaW5lZCBwcm9taXNlLFxuXHRcdFx0Ly8gYnkgc3Vic3RpdHV0aW5nIGEgZGlmZmVyZW50IGB0aGlzYCBiaW5kaW5nLlxuXHRcdFx0by5wcm9taXNlID0gbmV3IHRoaXMuY29uc3RydWN0b3IoZnVuY3Rpb24gZXh0cmFjdENoYWluKHJlc29sdmUscmVqZWN0KSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgcmVzb2x2ZSAhPSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIHJlamVjdCAhPSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHR0aHJvdyBUeXBlRXJyb3IoXCJOb3QgYSBmdW5jdGlvblwiKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG8ucmVzb2x2ZSA9IHJlc29sdmU7XG5cdFx0XHRcdG8ucmVqZWN0ID0gcmVqZWN0O1xuXHRcdFx0fSk7XG5cdFx0XHRkZWYuY2hhaW4ucHVzaChvKTtcblxuXHRcdFx0aWYgKGRlZi5zdGF0ZSAhPT0gMCkge1xuXHRcdFx0XHRzY2hlZHVsZShub3RpZnksZGVmKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG8ucHJvbWlzZTtcblx0XHR9O1xuXHRcdHRoaXNbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uICRjYXRjaCQoZmFpbHVyZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMudGhlbih2b2lkIDAsZmFpbHVyZSk7XG5cdFx0fTtcblxuXHRcdHRyeSB7XG5cdFx0XHRleGVjdXRvci5jYWxsKFxuXHRcdFx0XHR2b2lkIDAsXG5cdFx0XHRcdGZ1bmN0aW9uIHB1YmxpY1Jlc29sdmUobXNnKXtcblx0XHRcdFx0XHRyZXNvbHZlLmNhbGwoZGVmLG1zZyk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGZ1bmN0aW9uIHB1YmxpY1JlamVjdChtc2cpIHtcblx0XHRcdFx0XHRyZWplY3QuY2FsbChkZWYsbXNnKTtcblx0XHRcdFx0fVxuXHRcdFx0KTtcblx0XHR9XG5cdFx0Y2F0Y2ggKGVycikge1xuXHRcdFx0cmVqZWN0LmNhbGwoZGVmLGVycik7XG5cdFx0fVxuXHR9XG5cblx0dmFyIFByb21pc2VQcm90b3R5cGUgPSBidWlsdEluUHJvcCh7fSxcImNvbnN0cnVjdG9yXCIsUHJvbWlzZSxcblx0XHQvKmNvbmZpZ3VyYWJsZT0qL2ZhbHNlXG5cdCk7XG5cblx0Ly8gTm90ZTogQW5kcm9pZCA0IGNhbm5vdCB1c2UgYE9iamVjdC5kZWZpbmVQcm9wZXJ0eSguLilgIGhlcmVcblx0UHJvbWlzZS5wcm90b3R5cGUgPSBQcm9taXNlUHJvdG90eXBlO1xuXG5cdC8vIGJ1aWx0LWluIFwiYnJhbmRcIiB0byBzaWduYWwgYW4gXCJ1bmluaXRpYWxpemVkXCIgcHJvbWlzZVxuXHRidWlsdEluUHJvcChQcm9taXNlUHJvdG90eXBlLFwiX19OUE9fX1wiLDAsXG5cdFx0Lypjb25maWd1cmFibGU9Ki9mYWxzZVxuXHQpO1xuXG5cdGJ1aWx0SW5Qcm9wKFByb21pc2UsXCJyZXNvbHZlXCIsZnVuY3Rpb24gUHJvbWlzZSRyZXNvbHZlKG1zZykge1xuXHRcdHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cblx0XHQvLyBzcGVjIG1hbmRhdGVkIGNoZWNrc1xuXHRcdC8vIG5vdGU6IGJlc3QgXCJpc1Byb21pc2VcIiBjaGVjayB0aGF0J3MgcHJhY3RpY2FsIGZvciBub3dcblx0XHRpZiAobXNnICYmIHR5cGVvZiBtc2cgPT0gXCJvYmplY3RcIiAmJiBtc2cuX19OUE9fXyA9PT0gMSkge1xuXHRcdFx0cmV0dXJuIG1zZztcblx0XHR9XG5cblx0XHRyZXR1cm4gbmV3IENvbnN0cnVjdG9yKGZ1bmN0aW9uIGV4ZWN1dG9yKHJlc29sdmUscmVqZWN0KXtcblx0XHRcdGlmICh0eXBlb2YgcmVzb2x2ZSAhPSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIHJlamVjdCAhPSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0dGhyb3cgVHlwZUVycm9yKFwiTm90IGEgZnVuY3Rpb25cIik7XG5cdFx0XHR9XG5cblx0XHRcdHJlc29sdmUobXNnKTtcblx0XHR9KTtcblx0fSk7XG5cblx0YnVpbHRJblByb3AoUHJvbWlzZSxcInJlamVjdFwiLGZ1bmN0aW9uIFByb21pc2UkcmVqZWN0KG1zZykge1xuXHRcdHJldHVybiBuZXcgdGhpcyhmdW5jdGlvbiBleGVjdXRvcihyZXNvbHZlLHJlamVjdCl7XG5cdFx0XHRpZiAodHlwZW9mIHJlc29sdmUgIT0gXCJmdW5jdGlvblwiIHx8IHR5cGVvZiByZWplY3QgIT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdHRocm93IFR5cGVFcnJvcihcIk5vdCBhIGZ1bmN0aW9uXCIpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZWplY3QobXNnKTtcblx0XHR9KTtcblx0fSk7XG5cblx0YnVpbHRJblByb3AoUHJvbWlzZSxcImFsbFwiLGZ1bmN0aW9uIFByb21pc2UkYWxsKGFycikge1xuXHRcdHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cblx0XHQvLyBzcGVjIG1hbmRhdGVkIGNoZWNrc1xuXHRcdGlmIChUb1N0cmluZy5jYWxsKGFycikgIT0gXCJbb2JqZWN0IEFycmF5XVwiKSB7XG5cdFx0XHRyZXR1cm4gQ29uc3RydWN0b3IucmVqZWN0KFR5cGVFcnJvcihcIk5vdCBhbiBhcnJheVwiKSk7XG5cdFx0fVxuXHRcdGlmIChhcnIubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gQ29uc3RydWN0b3IucmVzb2x2ZShbXSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihmdW5jdGlvbiBleGVjdXRvcihyZXNvbHZlLHJlamVjdCl7XG5cdFx0XHRpZiAodHlwZW9mIHJlc29sdmUgIT0gXCJmdW5jdGlvblwiIHx8IHR5cGVvZiByZWplY3QgIT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdHRocm93IFR5cGVFcnJvcihcIk5vdCBhIGZ1bmN0aW9uXCIpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgbGVuID0gYXJyLmxlbmd0aCwgbXNncyA9IEFycmF5KGxlbiksIGNvdW50ID0gMDtcblxuXHRcdFx0aXRlcmF0ZVByb21pc2VzKENvbnN0cnVjdG9yLGFycixmdW5jdGlvbiByZXNvbHZlcihpZHgsbXNnKSB7XG5cdFx0XHRcdG1zZ3NbaWR4XSA9IG1zZztcblx0XHRcdFx0aWYgKCsrY291bnQgPT09IGxlbikge1xuXHRcdFx0XHRcdHJlc29sdmUobXNncyk7XG5cdFx0XHRcdH1cblx0XHRcdH0scmVqZWN0KTtcblx0XHR9KTtcblx0fSk7XG5cblx0YnVpbHRJblByb3AoUHJvbWlzZSxcInJhY2VcIixmdW5jdGlvbiBQcm9taXNlJHJhY2UoYXJyKSB7XG5cdFx0dmFyIENvbnN0cnVjdG9yID0gdGhpcztcblxuXHRcdC8vIHNwZWMgbWFuZGF0ZWQgY2hlY2tzXG5cdFx0aWYgKFRvU3RyaW5nLmNhbGwoYXJyKSAhPSBcIltvYmplY3QgQXJyYXldXCIpIHtcblx0XHRcdHJldHVybiBDb25zdHJ1Y3Rvci5yZWplY3QoVHlwZUVycm9yKFwiTm90IGFuIGFycmF5XCIpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbmV3IENvbnN0cnVjdG9yKGZ1bmN0aW9uIGV4ZWN1dG9yKHJlc29sdmUscmVqZWN0KXtcblx0XHRcdGlmICh0eXBlb2YgcmVzb2x2ZSAhPSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIHJlamVjdCAhPSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0dGhyb3cgVHlwZUVycm9yKFwiTm90IGEgZnVuY3Rpb25cIik7XG5cdFx0XHR9XG5cblx0XHRcdGl0ZXJhdGVQcm9taXNlcyhDb25zdHJ1Y3RvcixhcnIsZnVuY3Rpb24gcmVzb2x2ZXIoaWR4LG1zZyl7XG5cdFx0XHRcdHJlc29sdmUobXNnKTtcblx0XHRcdH0scmVqZWN0KTtcblx0XHR9KTtcblx0fSk7XG5cblx0cmV0dXJuIFByb21pc2U7XG59KTtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCwgdW5kZWZpbmVkKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBpZiAoZ2xvYmFsLnNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG5leHRIYW5kbGUgPSAxOyAvLyBTcGVjIHNheXMgZ3JlYXRlciB0aGFuIHplcm9cbiAgICB2YXIgdGFza3NCeUhhbmRsZSA9IHt9O1xuICAgIHZhciBjdXJyZW50bHlSdW5uaW5nQVRhc2sgPSBmYWxzZTtcbiAgICB2YXIgZG9jID0gZ2xvYmFsLmRvY3VtZW50O1xuICAgIHZhciByZWdpc3RlckltbWVkaWF0ZTtcblxuICAgIGZ1bmN0aW9uIHNldEltbWVkaWF0ZShjYWxsYmFjaykge1xuICAgICAgLy8gQ2FsbGJhY2sgY2FuIGVpdGhlciBiZSBhIGZ1bmN0aW9uIG9yIGEgc3RyaW5nXG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBuZXcgRnVuY3Rpb24oXCJcIiArIGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICAgIC8vIENvcHkgZnVuY3Rpb24gYXJndW1lbnRzXG4gICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXTtcbiAgICAgIH1cbiAgICAgIC8vIFN0b3JlIGFuZCByZWdpc3RlciB0aGUgdGFza1xuICAgICAgdmFyIHRhc2sgPSB7IGNhbGxiYWNrOiBjYWxsYmFjaywgYXJnczogYXJncyB9O1xuICAgICAgdGFza3NCeUhhbmRsZVtuZXh0SGFuZGxlXSA9IHRhc2s7XG4gICAgICByZWdpc3RlckltbWVkaWF0ZShuZXh0SGFuZGxlKTtcbiAgICAgIHJldHVybiBuZXh0SGFuZGxlKys7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xlYXJJbW1lZGlhdGUoaGFuZGxlKSB7XG4gICAgICAgIGRlbGV0ZSB0YXNrc0J5SGFuZGxlW2hhbmRsZV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcnVuKHRhc2spIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gdGFzay5jYWxsYmFjaztcbiAgICAgICAgdmFyIGFyZ3MgPSB0YXNrLmFyZ3M7XG4gICAgICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBjYWxsYmFjayhhcmdzWzBdKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBjYWxsYmFjayhhcmdzWzBdLCBhcmdzWzFdKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICBjYWxsYmFjayhhcmdzWzBdLCBhcmdzWzFdLCBhcmdzWzJdKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodW5kZWZpbmVkLCBhcmdzKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcnVuSWZQcmVzZW50KGhhbmRsZSkge1xuICAgICAgICAvLyBGcm9tIHRoZSBzcGVjOiBcIldhaXQgdW50aWwgYW55IGludm9jYXRpb25zIG9mIHRoaXMgYWxnb3JpdGhtIHN0YXJ0ZWQgYmVmb3JlIHRoaXMgb25lIGhhdmUgY29tcGxldGVkLlwiXG4gICAgICAgIC8vIFNvIGlmIHdlJ3JlIGN1cnJlbnRseSBydW5uaW5nIGEgdGFzaywgd2UnbGwgbmVlZCB0byBkZWxheSB0aGlzIGludm9jYXRpb24uXG4gICAgICAgIGlmIChjdXJyZW50bHlSdW5uaW5nQVRhc2spIHtcbiAgICAgICAgICAgIC8vIERlbGF5IGJ5IGRvaW5nIGEgc2V0VGltZW91dC4gc2V0SW1tZWRpYXRlIHdhcyB0cmllZCBpbnN0ZWFkLCBidXQgaW4gRmlyZWZveCA3IGl0IGdlbmVyYXRlZCBhXG4gICAgICAgICAgICAvLyBcInRvbyBtdWNoIHJlY3Vyc2lvblwiIGVycm9yLlxuICAgICAgICAgICAgc2V0VGltZW91dChydW5JZlByZXNlbnQsIDAsIGhhbmRsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdGFzayA9IHRhc2tzQnlIYW5kbGVbaGFuZGxlXTtcbiAgICAgICAgICAgIGlmICh0YXNrKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudGx5UnVubmluZ0FUYXNrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBydW4odGFzayk7XG4gICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbW1lZGlhdGUoaGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudGx5UnVubmluZ0FUYXNrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5zdGFsbE5leHRUaWNrSW1wbGVtZW50YXRpb24oKSB7XG4gICAgICAgIHJlZ2lzdGVySW1tZWRpYXRlID0gZnVuY3Rpb24oaGFuZGxlKSB7XG4gICAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHsgcnVuSWZQcmVzZW50KGhhbmRsZSk7IH0pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhblVzZVBvc3RNZXNzYWdlKCkge1xuICAgICAgICAvLyBUaGUgdGVzdCBhZ2FpbnN0IGBpbXBvcnRTY3JpcHRzYCBwcmV2ZW50cyB0aGlzIGltcGxlbWVudGF0aW9uIGZyb20gYmVpbmcgaW5zdGFsbGVkIGluc2lkZSBhIHdlYiB3b3JrZXIsXG4gICAgICAgIC8vIHdoZXJlIGBnbG9iYWwucG9zdE1lc3NhZ2VgIG1lYW5zIHNvbWV0aGluZyBjb21wbGV0ZWx5IGRpZmZlcmVudCBhbmQgY2FuJ3QgYmUgdXNlZCBmb3IgdGhpcyBwdXJwb3NlLlxuICAgICAgICBpZiAoZ2xvYmFsLnBvc3RNZXNzYWdlICYmICFnbG9iYWwuaW1wb3J0U2NyaXB0cykge1xuICAgICAgICAgICAgdmFyIHBvc3RNZXNzYWdlSXNBc3luY2hyb25vdXMgPSB0cnVlO1xuICAgICAgICAgICAgdmFyIG9sZE9uTWVzc2FnZSA9IGdsb2JhbC5vbm1lc3NhZ2U7XG4gICAgICAgICAgICBnbG9iYWwub25tZXNzYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcG9zdE1lc3NhZ2VJc0FzeW5jaHJvbm91cyA9IGZhbHNlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGdsb2JhbC5wb3N0TWVzc2FnZShcIlwiLCBcIipcIik7XG4gICAgICAgICAgICBnbG9iYWwub25tZXNzYWdlID0gb2xkT25NZXNzYWdlO1xuICAgICAgICAgICAgcmV0dXJuIHBvc3RNZXNzYWdlSXNBc3luY2hyb25vdXM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnN0YWxsUG9zdE1lc3NhZ2VJbXBsZW1lbnRhdGlvbigpIHtcbiAgICAgICAgLy8gSW5zdGFsbHMgYW4gZXZlbnQgaGFuZGxlciBvbiBgZ2xvYmFsYCBmb3IgdGhlIGBtZXNzYWdlYCBldmVudDogc2VlXG4gICAgICAgIC8vICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vRE9NL3dpbmRvdy5wb3N0TWVzc2FnZVxuICAgICAgICAvLyAqIGh0dHA6Ly93d3cud2hhdHdnLm9yZy9zcGVjcy93ZWItYXBwcy9jdXJyZW50LXdvcmsvbXVsdGlwYWdlL2NvbW1zLmh0bWwjY3Jvc3NEb2N1bWVudE1lc3NhZ2VzXG5cbiAgICAgICAgdmFyIG1lc3NhZ2VQcmVmaXggPSBcInNldEltbWVkaWF0ZSRcIiArIE1hdGgucmFuZG9tKCkgKyBcIiRcIjtcbiAgICAgICAgdmFyIG9uR2xvYmFsTWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQuc291cmNlID09PSBnbG9iYWwgJiZcbiAgICAgICAgICAgICAgICB0eXBlb2YgZXZlbnQuZGF0YSA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgICAgICAgICAgIGV2ZW50LmRhdGEuaW5kZXhPZihtZXNzYWdlUHJlZml4KSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJ1bklmUHJlc2VudCgrZXZlbnQuZGF0YS5zbGljZShtZXNzYWdlUHJlZml4Lmxlbmd0aCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIG9uR2xvYmFsTWVzc2FnZSwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2xvYmFsLmF0dGFjaEV2ZW50KFwib25tZXNzYWdlXCIsIG9uR2xvYmFsTWVzc2FnZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZWdpc3RlckltbWVkaWF0ZSA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuICAgICAgICAgICAgZ2xvYmFsLnBvc3RNZXNzYWdlKG1lc3NhZ2VQcmVmaXggKyBoYW5kbGUsIFwiKlwiKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnN0YWxsTWVzc2FnZUNoYW5uZWxJbXBsZW1lbnRhdGlvbigpIHtcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgdmFyIGhhbmRsZSA9IGV2ZW50LmRhdGE7XG4gICAgICAgICAgICBydW5JZlByZXNlbnQoaGFuZGxlKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZWdpc3RlckltbWVkaWF0ZSA9IGZ1bmN0aW9uKGhhbmRsZSkge1xuICAgICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZShoYW5kbGUpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluc3RhbGxSZWFkeVN0YXRlQ2hhbmdlSW1wbGVtZW50YXRpb24oKSB7XG4gICAgICAgIHZhciBodG1sID0gZG9jLmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgcmVnaXN0ZXJJbW1lZGlhdGUgPSBmdW5jdGlvbihoYW5kbGUpIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIDxzY3JpcHQ+IGVsZW1lbnQ7IGl0cyByZWFkeXN0YXRlY2hhbmdlIGV2ZW50IHdpbGwgYmUgZmlyZWQgYXN5bmNocm9ub3VzbHkgb25jZSBpdCBpcyBpbnNlcnRlZFxuICAgICAgICAgICAgLy8gaW50byB0aGUgZG9jdW1lbnQuIERvIHNvLCB0aHVzIHF1ZXVpbmcgdXAgdGhlIHRhc2suIFJlbWVtYmVyIHRvIGNsZWFuIHVwIG9uY2UgaXQncyBiZWVuIGNhbGxlZC5cbiAgICAgICAgICAgIHZhciBzY3JpcHQgPSBkb2MuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgICAgICAgICAgIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcnVuSWZQcmVzZW50KGhhbmRsZSk7XG4gICAgICAgICAgICAgICAgc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgaHRtbC5yZW1vdmVDaGlsZChzY3JpcHQpO1xuICAgICAgICAgICAgICAgIHNjcmlwdCA9IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaHRtbC5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluc3RhbGxTZXRUaW1lb3V0SW1wbGVtZW50YXRpb24oKSB7XG4gICAgICAgIHJlZ2lzdGVySW1tZWRpYXRlID0gZnVuY3Rpb24oaGFuZGxlKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KHJ1bklmUHJlc2VudCwgMCwgaGFuZGxlKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBJZiBzdXBwb3J0ZWQsIHdlIHNob3VsZCBhdHRhY2ggdG8gdGhlIHByb3RvdHlwZSBvZiBnbG9iYWwsIHNpbmNlIHRoYXQgaXMgd2hlcmUgc2V0VGltZW91dCBldCBhbC4gbGl2ZS5cbiAgICB2YXIgYXR0YWNoVG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKGdsb2JhbCk7XG4gICAgYXR0YWNoVG8gPSBhdHRhY2hUbyAmJiBhdHRhY2hUby5zZXRUaW1lb3V0ID8gYXR0YWNoVG8gOiBnbG9iYWw7XG5cbiAgICAvLyBEb24ndCBnZXQgZm9vbGVkIGJ5IGUuZy4gYnJvd3NlcmlmeSBlbnZpcm9ubWVudHMuXG4gICAgaWYgKHt9LnRvU3RyaW5nLmNhbGwoZ2xvYmFsLnByb2Nlc3MpID09PSBcIltvYmplY3QgcHJvY2Vzc11cIikge1xuICAgICAgICAvLyBGb3IgTm9kZS5qcyBiZWZvcmUgMC45XG4gICAgICAgIGluc3RhbGxOZXh0VGlja0ltcGxlbWVudGF0aW9uKCk7XG5cbiAgICB9IGVsc2UgaWYgKGNhblVzZVBvc3RNZXNzYWdlKCkpIHtcbiAgICAgICAgLy8gRm9yIG5vbi1JRTEwIG1vZGVybiBicm93c2Vyc1xuICAgICAgICBpbnN0YWxsUG9zdE1lc3NhZ2VJbXBsZW1lbnRhdGlvbigpO1xuXG4gICAgfSBlbHNlIGlmIChnbG9iYWwuTWVzc2FnZUNoYW5uZWwpIHtcbiAgICAgICAgLy8gRm9yIHdlYiB3b3JrZXJzLCB3aGVyZSBzdXBwb3J0ZWRcbiAgICAgICAgaW5zdGFsbE1lc3NhZ2VDaGFubmVsSW1wbGVtZW50YXRpb24oKTtcblxuICAgIH0gZWxzZSBpZiAoZG9jICYmIFwib25yZWFkeXN0YXRlY2hhbmdlXCIgaW4gZG9jLmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIikpIHtcbiAgICAgICAgLy8gRm9yIElFIDbigJM4XG4gICAgICAgIGluc3RhbGxSZWFkeVN0YXRlQ2hhbmdlSW1wbGVtZW50YXRpb24oKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZvciBvbGRlciBicm93c2Vyc1xuICAgICAgICBpbnN0YWxsU2V0VGltZW91dEltcGxlbWVudGF0aW9uKCk7XG4gICAgfVxuXG4gICAgYXR0YWNoVG8uc2V0SW1tZWRpYXRlID0gc2V0SW1tZWRpYXRlO1xuICAgIGF0dGFjaFRvLmNsZWFySW1tZWRpYXRlID0gY2xlYXJJbW1lZGlhdGU7XG59KHR5cGVvZiBzZWxmID09PSBcInVuZGVmaW5lZFwiID8gdHlwZW9mIGdsb2JhbCA9PT0gXCJ1bmRlZmluZWRcIiA/IHRoaXMgOiBnbG9iYWwgOiBzZWxmKSk7XG4iLCJmdW5jdGlvbiBBZ2VudCgpIHtcbiAgdGhpcy5fZGVmYXVsdHMgPSBbXTtcbn1cblxuW1widXNlXCIsIFwib25cIiwgXCJvbmNlXCIsIFwic2V0XCIsIFwicXVlcnlcIiwgXCJ0eXBlXCIsIFwiYWNjZXB0XCIsIFwiYXV0aFwiLCBcIndpdGhDcmVkZW50aWFsc1wiLCBcInNvcnRRdWVyeVwiLCBcInJldHJ5XCIsIFwib2tcIiwgXCJyZWRpcmVjdHNcIixcbiBcInRpbWVvdXRcIiwgXCJidWZmZXJcIiwgXCJzZXJpYWxpemVcIiwgXCJwYXJzZVwiLCBcImNhXCIsIFwia2V5XCIsIFwicGZ4XCIsIFwiY2VydFwiXS5mb3JFYWNoKGZ1bmN0aW9uKGZuKSB7XG4gIC8qKiBEZWZhdWx0IHNldHRpbmcgZm9yIGFsbCByZXF1ZXN0cyBmcm9tIHRoaXMgYWdlbnQgKi9cbiAgQWdlbnQucHJvdG90eXBlW2ZuXSA9IGZ1bmN0aW9uKC8qdmFyYXJncyovKSB7XG4gICAgdGhpcy5fZGVmYXVsdHMucHVzaCh7Zm46Zm4sIGFyZ3VtZW50czphcmd1bWVudHN9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufSk7XG5cbkFnZW50LnByb3RvdHlwZS5fc2V0RGVmYXVsdHMgPSBmdW5jdGlvbihyZXEpIHtcbiAgICB0aGlzLl9kZWZhdWx0cy5mb3JFYWNoKGZ1bmN0aW9uKGRlZikge1xuICAgICAgcmVxW2RlZi5mbl0uYXBwbHkocmVxLCBkZWYuYXJndW1lbnRzKTtcbiAgICB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQWdlbnQ7XG4iLCIvKipcbiAqIFJvb3QgcmVmZXJlbmNlIGZvciBpZnJhbWVzLlxuICovXG5cbnZhciByb290O1xuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7IC8vIEJyb3dzZXIgd2luZG93XG4gIHJvb3QgPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykgeyAvLyBXZWIgV29ya2VyXG4gIHJvb3QgPSBzZWxmO1xufSBlbHNlIHsgLy8gT3RoZXIgZW52aXJvbm1lbnRzXG4gIGNvbnNvbGUud2FybihcIlVzaW5nIGJyb3dzZXItb25seSB2ZXJzaW9uIG9mIHN1cGVyYWdlbnQgaW4gbm9uLWJyb3dzZXIgZW52aXJvbm1lbnRcIik7XG4gIHJvb3QgPSB0aGlzO1xufVxuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJ2NvbXBvbmVudC1lbWl0dGVyJyk7XG52YXIgUmVxdWVzdEJhc2UgPSByZXF1aXJlKCcuL3JlcXVlc3QtYmFzZScpO1xudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pcy1vYmplY3QnKTtcbnZhciBSZXNwb25zZUJhc2UgPSByZXF1aXJlKCcuL3Jlc3BvbnNlLWJhc2UnKTtcbnZhciBBZ2VudCA9IHJlcXVpcmUoJy4vYWdlbnQtYmFzZScpO1xuXG4vKipcbiAqIE5vb3AuXG4gKi9cblxuZnVuY3Rpb24gbm9vcCgpe307XG5cbi8qKlxuICogRXhwb3NlIGByZXF1ZXN0YC5cbiAqL1xuXG52YXIgcmVxdWVzdCA9IGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsKSB7XG4gIC8vIGNhbGxiYWNrXG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiB1cmwpIHtcbiAgICByZXR1cm4gbmV3IGV4cG9ydHMuUmVxdWVzdCgnR0VUJywgbWV0aG9kKS5lbmQodXJsKTtcbiAgfVxuXG4gIC8vIHVybCBmaXJzdFxuICBpZiAoMSA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG5ldyBleHBvcnRzLlJlcXVlc3QoJ0dFVCcsIG1ldGhvZCk7XG4gIH1cblxuICByZXR1cm4gbmV3IGV4cG9ydHMuUmVxdWVzdChtZXRob2QsIHVybCk7XG59XG5cbmV4cG9ydHMuUmVxdWVzdCA9IFJlcXVlc3Q7XG5cbi8qKlxuICogRGV0ZXJtaW5lIFhIUi5cbiAqL1xuXG5yZXF1ZXN0LmdldFhIUiA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHJvb3QuWE1MSHR0cFJlcXVlc3RcbiAgICAgICYmICghcm9vdC5sb2NhdGlvbiB8fCAnZmlsZTonICE9IHJvb3QubG9jYXRpb24ucHJvdG9jb2xcbiAgICAgICAgICB8fCAhcm9vdC5BY3RpdmVYT2JqZWN0KSkge1xuICAgIHJldHVybiBuZXcgWE1MSHR0cFJlcXVlc3Q7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MSFRUUCcpOyB9IGNhdGNoKGUpIHt9XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNc3htbDIuWE1MSFRUUC42LjAnKTsgfSBjYXRjaChlKSB7fVxuICAgIHRyeSB7IHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTXN4bWwyLlhNTEhUVFAuMy4wJyk7IH0gY2F0Y2goZSkge31cbiAgICB0cnkgeyByZXR1cm4gbmV3IEFjdGl2ZVhPYmplY3QoJ01zeG1sMi5YTUxIVFRQJyk7IH0gY2F0Y2goZSkge31cbiAgfVxuICB0aHJvdyBFcnJvcihcIkJyb3dzZXItb25seSB2ZXJzaW9uIG9mIHN1cGVyYWdlbnQgY291bGQgbm90IGZpbmQgWEhSXCIpO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UsIGFkZGVkIHRvIHN1cHBvcnQgSUUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbnZhciB0cmltID0gJycudHJpbVxuICA/IGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMudHJpbSgpOyB9XG4gIDogZnVuY3Rpb24ocykgeyByZXR1cm4gcy5yZXBsYWNlKC8oXlxccyp8XFxzKiQpL2csICcnKTsgfTtcblxuLyoqXG4gKiBTZXJpYWxpemUgdGhlIGdpdmVuIGBvYmpgLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZShvYmopIHtcbiAgaWYgKCFpc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICB2YXIgcGFpcnMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIHB1c2hFbmNvZGVkS2V5VmFsdWVQYWlyKHBhaXJzLCBrZXksIG9ialtrZXldKTtcbiAgfVxuICByZXR1cm4gcGFpcnMuam9pbignJicpO1xufVxuXG4vKipcbiAqIEhlbHBzICdzZXJpYWxpemUnIHdpdGggc2VyaWFsaXppbmcgYXJyYXlzLlxuICogTXV0YXRlcyB0aGUgcGFpcnMgYXJyYXkuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gcGFpcnNcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICovXG5cbmZ1bmN0aW9uIHB1c2hFbmNvZGVkS2V5VmFsdWVQYWlyKHBhaXJzLCBrZXksIHZhbCkge1xuICBpZiAodmFsICE9IG51bGwpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICB2YWwuZm9yRWFjaChmdW5jdGlvbih2KSB7XG4gICAgICAgIHB1c2hFbmNvZGVkS2V5VmFsdWVQYWlyKHBhaXJzLCBrZXksIHYpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChpc09iamVjdCh2YWwpKSB7XG4gICAgICBmb3IodmFyIHN1YmtleSBpbiB2YWwpIHtcbiAgICAgICAgcHVzaEVuY29kZWRLZXlWYWx1ZVBhaXIocGFpcnMsIGtleSArICdbJyArIHN1YmtleSArICddJywgdmFsW3N1YmtleV0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwYWlycy5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChrZXkpXG4gICAgICAgICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbCkpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh2YWwgPT09IG51bGwpIHtcbiAgICBwYWlycy5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChrZXkpKTtcbiAgfVxufVxuXG4vKipcbiAqIEV4cG9zZSBzZXJpYWxpemF0aW9uIG1ldGhvZC5cbiAqL1xuXG5yZXF1ZXN0LnNlcmlhbGl6ZU9iamVjdCA9IHNlcmlhbGl6ZTtcblxuLyoqXG4gICogUGFyc2UgdGhlIGdpdmVuIHgtd3d3LWZvcm0tdXJsZW5jb2RlZCBgc3RyYC5cbiAgKlxuICAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICogQGFwaSBwcml2YXRlXG4gICovXG5cbmZ1bmN0aW9uIHBhcnNlU3RyaW5nKHN0cikge1xuICB2YXIgb2JqID0ge307XG4gIHZhciBwYWlycyA9IHN0ci5zcGxpdCgnJicpO1xuICB2YXIgcGFpcjtcbiAgdmFyIHBvcztcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gcGFpcnMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBwYWlyID0gcGFpcnNbaV07XG4gICAgcG9zID0gcGFpci5pbmRleE9mKCc9Jyk7XG4gICAgaWYgKHBvcyA9PSAtMSkge1xuICAgICAgb2JqW2RlY29kZVVSSUNvbXBvbmVudChwYWlyKV0gPSAnJztcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqW2RlY29kZVVSSUNvbXBvbmVudChwYWlyLnNsaWNlKDAsIHBvcykpXSA9XG4gICAgICAgIGRlY29kZVVSSUNvbXBvbmVudChwYWlyLnNsaWNlKHBvcyArIDEpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIEV4cG9zZSBwYXJzZXIuXG4gKi9cblxucmVxdWVzdC5wYXJzZVN0cmluZyA9IHBhcnNlU3RyaW5nO1xuXG4vKipcbiAqIERlZmF1bHQgTUlNRSB0eXBlIG1hcC5cbiAqXG4gKiAgICAgc3VwZXJhZ2VudC50eXBlcy54bWwgPSAnYXBwbGljYXRpb24veG1sJztcbiAqXG4gKi9cblxucmVxdWVzdC50eXBlcyA9IHtcbiAgaHRtbDogJ3RleHQvaHRtbCcsXG4gIGpzb246ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgeG1sOiAndGV4dC94bWwnLFxuICB1cmxlbmNvZGVkOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcbiAgJ2Zvcm0nOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcbiAgJ2Zvcm0tZGF0YSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXG59O1xuXG4vKipcbiAqIERlZmF1bHQgc2VyaWFsaXphdGlvbiBtYXAuXG4gKlxuICogICAgIHN1cGVyYWdlbnQuc2VyaWFsaXplWydhcHBsaWNhdGlvbi94bWwnXSA9IGZ1bmN0aW9uKG9iail7XG4gKiAgICAgICByZXR1cm4gJ2dlbmVyYXRlZCB4bWwgaGVyZSc7XG4gKiAgICAgfTtcbiAqXG4gKi9cblxucmVxdWVzdC5zZXJpYWxpemUgPSB7XG4gICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnOiBzZXJpYWxpemUsXG4gICdhcHBsaWNhdGlvbi9qc29uJzogSlNPTi5zdHJpbmdpZnlcbn07XG5cbi8qKlxuICAqIERlZmF1bHQgcGFyc2Vycy5cbiAgKlxuICAqICAgICBzdXBlcmFnZW50LnBhcnNlWydhcHBsaWNhdGlvbi94bWwnXSA9IGZ1bmN0aW9uKHN0cil7XG4gICogICAgICAgcmV0dXJuIHsgb2JqZWN0IHBhcnNlZCBmcm9tIHN0ciB9O1xuICAqICAgICB9O1xuICAqXG4gICovXG5cbnJlcXVlc3QucGFyc2UgPSB7XG4gICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnOiBwYXJzZVN0cmluZyxcbiAgJ2FwcGxpY2F0aW9uL2pzb24nOiBKU09OLnBhcnNlXG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBoZWFkZXIgYHN0cmAgaW50b1xuICogYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG1hcHBlZCBmaWVsZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2VIZWFkZXIoc3RyKSB7XG4gIHZhciBsaW5lcyA9IHN0ci5zcGxpdCgvXFxyP1xcbi8pO1xuICB2YXIgZmllbGRzID0ge307XG4gIHZhciBpbmRleDtcbiAgdmFyIGxpbmU7XG4gIHZhciBmaWVsZDtcbiAgdmFyIHZhbDtcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gbGluZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBsaW5lID0gbGluZXNbaV07XG4gICAgaW5kZXggPSBsaW5lLmluZGV4T2YoJzonKTtcbiAgICBpZiAoaW5kZXggPT09IC0xKSB7IC8vIGNvdWxkIGJlIGVtcHR5IGxpbmUsIGp1c3Qgc2tpcCBpdFxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGZpZWxkID0gbGluZS5zbGljZSgwLCBpbmRleCkudG9Mb3dlckNhc2UoKTtcbiAgICB2YWwgPSB0cmltKGxpbmUuc2xpY2UoaW5kZXggKyAxKSk7XG4gICAgZmllbGRzW2ZpZWxkXSA9IHZhbDtcbiAgfVxuXG4gIHJldHVybiBmaWVsZHM7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYG1pbWVgIGlzIGpzb24gb3IgaGFzICtqc29uIHN0cnVjdHVyZWQgc3ludGF4IHN1ZmZpeC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbWltZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGlzSlNPTihtaW1lKSB7XG4gIC8vIHNob3VsZCBtYXRjaCAvanNvbiBvciAranNvblxuICAvLyBidXQgbm90IC9qc29uLXNlcVxuICByZXR1cm4gL1tcXC8rXWpzb24oJHxbXi1cXHddKS8udGVzdChtaW1lKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBSZXNwb25zZWAgd2l0aCB0aGUgZ2l2ZW4gYHhocmAuXG4gKlxuICogIC0gc2V0IGZsYWdzICgub2ssIC5lcnJvciwgZXRjKVxuICogIC0gcGFyc2UgaGVhZGVyXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogIEFsaWFzaW5nIGBzdXBlcmFnZW50YCBhcyBgcmVxdWVzdGAgaXMgbmljZTpcbiAqXG4gKiAgICAgIHJlcXVlc3QgPSBzdXBlcmFnZW50O1xuICpcbiAqICBXZSBjYW4gdXNlIHRoZSBwcm9taXNlLWxpa2UgQVBJLCBvciBwYXNzIGNhbGxiYWNrczpcbiAqXG4gKiAgICAgIHJlcXVlc3QuZ2V0KCcvJykuZW5kKGZ1bmN0aW9uKHJlcyl7fSk7XG4gKiAgICAgIHJlcXVlc3QuZ2V0KCcvJywgZnVuY3Rpb24ocmVzKXt9KTtcbiAqXG4gKiAgU2VuZGluZyBkYXRhIGNhbiBiZSBjaGFpbmVkOlxuICpcbiAqICAgICAgcmVxdWVzdFxuICogICAgICAgIC5wb3N0KCcvdXNlcicpXG4gKiAgICAgICAgLnNlbmQoeyBuYW1lOiAndGonIH0pXG4gKiAgICAgICAgLmVuZChmdW5jdGlvbihyZXMpe30pO1xuICpcbiAqICBPciBwYXNzZWQgdG8gYC5zZW5kKClgOlxuICpcbiAqICAgICAgcmVxdWVzdFxuICogICAgICAgIC5wb3N0KCcvdXNlcicpXG4gKiAgICAgICAgLnNlbmQoeyBuYW1lOiAndGonIH0sIGZ1bmN0aW9uKHJlcyl7fSk7XG4gKlxuICogIE9yIHBhc3NlZCB0byBgLnBvc3QoKWA6XG4gKlxuICogICAgICByZXF1ZXN0XG4gKiAgICAgICAgLnBvc3QoJy91c2VyJywgeyBuYW1lOiAndGonIH0pXG4gKiAgICAgICAgLmVuZChmdW5jdGlvbihyZXMpe30pO1xuICpcbiAqIE9yIGZ1cnRoZXIgcmVkdWNlZCB0byBhIHNpbmdsZSBjYWxsIGZvciBzaW1wbGUgY2FzZXM6XG4gKlxuICogICAgICByZXF1ZXN0XG4gKiAgICAgICAgLnBvc3QoJy91c2VyJywgeyBuYW1lOiAndGonIH0sIGZ1bmN0aW9uKHJlcyl7fSk7XG4gKlxuICogQHBhcmFtIHtYTUxIVFRQUmVxdWVzdH0geGhyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gUmVzcG9uc2UocmVxKSB7XG4gIHRoaXMucmVxID0gcmVxO1xuICB0aGlzLnhociA9IHRoaXMucmVxLnhocjtcbiAgLy8gcmVzcG9uc2VUZXh0IGlzIGFjY2Vzc2libGUgb25seSBpZiByZXNwb25zZVR5cGUgaXMgJycgb3IgJ3RleHQnIGFuZCBvbiBvbGRlciBicm93c2Vyc1xuICB0aGlzLnRleHQgPSAoKHRoaXMucmVxLm1ldGhvZCAhPSdIRUFEJyAmJiAodGhpcy54aHIucmVzcG9uc2VUeXBlID09PSAnJyB8fCB0aGlzLnhoci5yZXNwb25zZVR5cGUgPT09ICd0ZXh0JykpIHx8IHR5cGVvZiB0aGlzLnhoci5yZXNwb25zZVR5cGUgPT09ICd1bmRlZmluZWQnKVxuICAgICA/IHRoaXMueGhyLnJlc3BvbnNlVGV4dFxuICAgICA6IG51bGw7XG4gIHRoaXMuc3RhdHVzVGV4dCA9IHRoaXMucmVxLnhoci5zdGF0dXNUZXh0O1xuICB2YXIgc3RhdHVzID0gdGhpcy54aHIuc3RhdHVzO1xuICAvLyBoYW5kbGUgSUU5IGJ1ZzogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDA0Njk3Mi9tc2llLXJldHVybnMtc3RhdHVzLWNvZGUtb2YtMTIyMy1mb3ItYWpheC1yZXF1ZXN0XG4gIGlmIChzdGF0dXMgPT09IDEyMjMpIHtcbiAgICBzdGF0dXMgPSAyMDQ7XG4gIH1cbiAgdGhpcy5fc2V0U3RhdHVzUHJvcGVydGllcyhzdGF0dXMpO1xuICB0aGlzLmhlYWRlciA9IHRoaXMuaGVhZGVycyA9IHBhcnNlSGVhZGVyKHRoaXMueGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpKTtcbiAgLy8gZ2V0QWxsUmVzcG9uc2VIZWFkZXJzIHNvbWV0aW1lcyBmYWxzZWx5IHJldHVybnMgXCJcIiBmb3IgQ09SUyByZXF1ZXN0cywgYnV0XG4gIC8vIGdldFJlc3BvbnNlSGVhZGVyIHN0aWxsIHdvcmtzLiBzbyB3ZSBnZXQgY29udGVudC10eXBlIGV2ZW4gaWYgZ2V0dGluZ1xuICAvLyBvdGhlciBoZWFkZXJzIGZhaWxzLlxuICB0aGlzLmhlYWRlclsnY29udGVudC10eXBlJ10gPSB0aGlzLnhoci5nZXRSZXNwb25zZUhlYWRlcignY29udGVudC10eXBlJyk7XG4gIHRoaXMuX3NldEhlYWRlclByb3BlcnRpZXModGhpcy5oZWFkZXIpO1xuXG4gIGlmIChudWxsID09PSB0aGlzLnRleHQgJiYgcmVxLl9yZXNwb25zZVR5cGUpIHtcbiAgICB0aGlzLmJvZHkgPSB0aGlzLnhoci5yZXNwb25zZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmJvZHkgPSB0aGlzLnJlcS5tZXRob2QgIT0gJ0hFQUQnXG4gICAgICA/IHRoaXMuX3BhcnNlQm9keSh0aGlzLnRleHQgPyB0aGlzLnRleHQgOiB0aGlzLnhoci5yZXNwb25zZSlcbiAgICAgIDogbnVsbDtcbiAgfVxufVxuXG5SZXNwb25zZUJhc2UoUmVzcG9uc2UucHJvdG90eXBlKTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYm9keSBgc3RyYC5cbiAqXG4gKiBVc2VkIGZvciBhdXRvLXBhcnNpbmcgb2YgYm9kaWVzLiBQYXJzZXJzXG4gKiBhcmUgZGVmaW5lZCBvbiB0aGUgYHN1cGVyYWdlbnQucGFyc2VgIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlc3BvbnNlLnByb3RvdHlwZS5fcGFyc2VCb2R5ID0gZnVuY3Rpb24oc3RyKSB7XG4gIHZhciBwYXJzZSA9IHJlcXVlc3QucGFyc2VbdGhpcy50eXBlXTtcbiAgaWYgKHRoaXMucmVxLl9wYXJzZXIpIHtcbiAgICByZXR1cm4gdGhpcy5yZXEuX3BhcnNlcih0aGlzLCBzdHIpO1xuICB9XG4gIGlmICghcGFyc2UgJiYgaXNKU09OKHRoaXMudHlwZSkpIHtcbiAgICBwYXJzZSA9IHJlcXVlc3QucGFyc2VbJ2FwcGxpY2F0aW9uL2pzb24nXTtcbiAgfVxuICByZXR1cm4gcGFyc2UgJiYgc3RyICYmIChzdHIubGVuZ3RoIHx8IHN0ciBpbnN0YW5jZW9mIE9iamVjdClcbiAgICA/IHBhcnNlKHN0cilcbiAgICA6IG51bGw7XG59O1xuXG4vKipcbiAqIFJldHVybiBhbiBgRXJyb3JgIHJlcHJlc2VudGF0aXZlIG9mIHRoaXMgcmVzcG9uc2UuXG4gKlxuICogQHJldHVybiB7RXJyb3J9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlc3BvbnNlLnByb3RvdHlwZS50b0Vycm9yID0gZnVuY3Rpb24oKXtcbiAgdmFyIHJlcSA9IHRoaXMucmVxO1xuICB2YXIgbWV0aG9kID0gcmVxLm1ldGhvZDtcbiAgdmFyIHVybCA9IHJlcS51cmw7XG5cbiAgdmFyIG1zZyA9ICdjYW5ub3QgJyArIG1ldGhvZCArICcgJyArIHVybCArICcgKCcgKyB0aGlzLnN0YXR1cyArICcpJztcbiAgdmFyIGVyciA9IG5ldyBFcnJvcihtc2cpO1xuICBlcnIuc3RhdHVzID0gdGhpcy5zdGF0dXM7XG4gIGVyci5tZXRob2QgPSBtZXRob2Q7XG4gIGVyci51cmwgPSB1cmw7XG5cbiAgcmV0dXJuIGVycjtcbn07XG5cbi8qKlxuICogRXhwb3NlIGBSZXNwb25zZWAuXG4gKi9cblxucmVxdWVzdC5SZXNwb25zZSA9IFJlc3BvbnNlO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYFJlcXVlc3RgIHdpdGggdGhlIGdpdmVuIGBtZXRob2RgIGFuZCBgdXJsYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIFJlcXVlc3QobWV0aG9kLCB1cmwpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLl9xdWVyeSA9IHRoaXMuX3F1ZXJ5IHx8IFtdO1xuICB0aGlzLm1ldGhvZCA9IG1ldGhvZDtcbiAgdGhpcy51cmwgPSB1cmw7XG4gIHRoaXMuaGVhZGVyID0ge307IC8vIHByZXNlcnZlcyBoZWFkZXIgbmFtZSBjYXNlXG4gIHRoaXMuX2hlYWRlciA9IHt9OyAvLyBjb2VyY2VzIGhlYWRlciBuYW1lcyB0byBsb3dlcmNhc2VcbiAgdGhpcy5vbignZW5kJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgZXJyID0gbnVsbDtcbiAgICB2YXIgcmVzID0gbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICByZXMgPSBuZXcgUmVzcG9uc2Uoc2VsZik7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBlcnIgPSBuZXcgRXJyb3IoJ1BhcnNlciBpcyB1bmFibGUgdG8gcGFyc2UgdGhlIHJlc3BvbnNlJyk7XG4gICAgICBlcnIucGFyc2UgPSB0cnVlO1xuICAgICAgZXJyLm9yaWdpbmFsID0gZTtcbiAgICAgIC8vIGlzc3VlICM2NzU6IHJldHVybiB0aGUgcmF3IHJlc3BvbnNlIGlmIHRoZSByZXNwb25zZSBwYXJzaW5nIGZhaWxzXG4gICAgICBpZiAoc2VsZi54aHIpIHtcbiAgICAgICAgLy8gaWU5IGRvZXNuJ3QgaGF2ZSAncmVzcG9uc2UnIHByb3BlcnR5XG4gICAgICAgIGVyci5yYXdSZXNwb25zZSA9IHR5cGVvZiBzZWxmLnhoci5yZXNwb25zZVR5cGUgPT0gJ3VuZGVmaW5lZCcgPyBzZWxmLnhoci5yZXNwb25zZVRleHQgOiBzZWxmLnhoci5yZXNwb25zZTtcbiAgICAgICAgLy8gaXNzdWUgIzg3NjogcmV0dXJuIHRoZSBodHRwIHN0YXR1cyBjb2RlIGlmIHRoZSByZXNwb25zZSBwYXJzaW5nIGZhaWxzXG4gICAgICAgIGVyci5zdGF0dXMgPSBzZWxmLnhoci5zdGF0dXMgPyBzZWxmLnhoci5zdGF0dXMgOiBudWxsO1xuICAgICAgICBlcnIuc3RhdHVzQ29kZSA9IGVyci5zdGF0dXM7IC8vIGJhY2t3YXJkcy1jb21wYXQgb25seVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyLnJhd1Jlc3BvbnNlID0gbnVsbDtcbiAgICAgICAgZXJyLnN0YXR1cyA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmLmNhbGxiYWNrKGVycik7XG4gICAgfVxuXG4gICAgc2VsZi5lbWl0KCdyZXNwb25zZScsIHJlcyk7XG5cbiAgICB2YXIgbmV3X2VycjtcbiAgICB0cnkge1xuICAgICAgaWYgKCFzZWxmLl9pc1Jlc3BvbnNlT0socmVzKSkge1xuICAgICAgICBuZXdfZXJyID0gbmV3IEVycm9yKHJlcy5zdGF0dXNUZXh0IHx8ICdVbnN1Y2Nlc3NmdWwgSFRUUCByZXNwb25zZScpO1xuICAgICAgfVxuICAgIH0gY2F0Y2goY3VzdG9tX2Vycikge1xuICAgICAgbmV3X2VyciA9IGN1c3RvbV9lcnI7IC8vIG9rKCkgY2FsbGJhY2sgY2FuIHRocm93XG4gICAgfVxuXG4gICAgLy8gIzEwMDAgZG9uJ3QgY2F0Y2ggZXJyb3JzIGZyb20gdGhlIGNhbGxiYWNrIHRvIGF2b2lkIGRvdWJsZSBjYWxsaW5nIGl0XG4gICAgaWYgKG5ld19lcnIpIHtcbiAgICAgIG5ld19lcnIub3JpZ2luYWwgPSBlcnI7XG4gICAgICBuZXdfZXJyLnJlc3BvbnNlID0gcmVzO1xuICAgICAgbmV3X2Vyci5zdGF0dXMgPSByZXMuc3RhdHVzO1xuICAgICAgc2VsZi5jYWxsYmFjayhuZXdfZXJyLCByZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLmNhbGxiYWNrKG51bGwsIHJlcyk7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBNaXhpbiBgRW1pdHRlcmAgYW5kIGBSZXF1ZXN0QmFzZWAuXG4gKi9cblxuRW1pdHRlcihSZXF1ZXN0LnByb3RvdHlwZSk7XG5SZXF1ZXN0QmFzZShSZXF1ZXN0LnByb3RvdHlwZSk7XG5cbi8qKlxuICogU2V0IENvbnRlbnQtVHlwZSB0byBgdHlwZWAsIG1hcHBpbmcgdmFsdWVzIGZyb20gYHJlcXVlc3QudHlwZXNgLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgc3VwZXJhZ2VudC50eXBlcy54bWwgPSAnYXBwbGljYXRpb24veG1sJztcbiAqXG4gKiAgICAgIHJlcXVlc3QucG9zdCgnLycpXG4gKiAgICAgICAgLnR5cGUoJ3htbCcpXG4gKiAgICAgICAgLnNlbmQoeG1sc3RyaW5nKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqICAgICAgcmVxdWVzdC5wb3N0KCcvJylcbiAqICAgICAgICAudHlwZSgnYXBwbGljYXRpb24veG1sJylcbiAqICAgICAgICAuc2VuZCh4bWxzdHJpbmcpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS50eXBlID0gZnVuY3Rpb24odHlwZSl7XG4gIHRoaXMuc2V0KCdDb250ZW50LVR5cGUnLCByZXF1ZXN0LnR5cGVzW3R5cGVdIHx8IHR5cGUpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IEFjY2VwdCB0byBgdHlwZWAsIG1hcHBpbmcgdmFsdWVzIGZyb20gYHJlcXVlc3QudHlwZXNgLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgc3VwZXJhZ2VudC50eXBlcy5qc29uID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICpcbiAqICAgICAgcmVxdWVzdC5nZXQoJy9hZ2VudCcpXG4gKiAgICAgICAgLmFjY2VwdCgnanNvbicpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogICAgICByZXF1ZXN0LmdldCgnL2FnZW50JylcbiAqICAgICAgICAuYWNjZXB0KCdhcHBsaWNhdGlvbi9qc29uJylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gYWNjZXB0XG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuYWNjZXB0ID0gZnVuY3Rpb24odHlwZSl7XG4gIHRoaXMuc2V0KCdBY2NlcHQnLCByZXF1ZXN0LnR5cGVzW3R5cGVdIHx8IHR5cGUpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IEF1dGhvcml6YXRpb24gZmllbGQgdmFsdWUgd2l0aCBgdXNlcmAgYW5kIGBwYXNzYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlclxuICogQHBhcmFtIHtTdHJpbmd9IFtwYXNzXSBvcHRpb25hbCBpbiBjYXNlIG9mIHVzaW5nICdiZWFyZXInIGFzIHR5cGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIHdpdGggJ3R5cGUnIHByb3BlcnR5ICdhdXRvJywgJ2Jhc2ljJyBvciAnYmVhcmVyJyAoZGVmYXVsdCAnYmFzaWMnKVxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmF1dGggPSBmdW5jdGlvbih1c2VyLCBwYXNzLCBvcHRpb25zKXtcbiAgaWYgKDEgPT09IGFyZ3VtZW50cy5sZW5ndGgpIHBhc3MgPSAnJztcbiAgaWYgKHR5cGVvZiBwYXNzID09PSAnb2JqZWN0JyAmJiBwYXNzICE9PSBudWxsKSB7IC8vIHBhc3MgaXMgb3B0aW9uYWwgYW5kIGNhbiBiZSByZXBsYWNlZCB3aXRoIG9wdGlvbnNcbiAgICBvcHRpb25zID0gcGFzcztcbiAgICBwYXNzID0gJyc7XG4gIH1cbiAgaWYgKCFvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIHR5cGU6ICdmdW5jdGlvbicgPT09IHR5cGVvZiBidG9hID8gJ2Jhc2ljJyA6ICdhdXRvJyxcbiAgICB9O1xuICB9XG5cbiAgdmFyIGVuY29kZXIgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGJ0b2EpIHtcbiAgICAgIHJldHVybiBidG9hKHN0cmluZyk7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHVzZSBiYXNpYyBhdXRoLCBidG9hIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG4gIH07XG5cbiAgcmV0dXJuIHRoaXMuX2F1dGgodXNlciwgcGFzcywgb3B0aW9ucywgZW5jb2Rlcik7XG59O1xuXG4vKipcbiAqIEFkZCBxdWVyeS1zdHJpbmcgYHZhbGAuXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICByZXF1ZXN0LmdldCgnL3Nob2VzJylcbiAqICAgICAucXVlcnkoJ3NpemU9MTAnKVxuICogICAgIC5xdWVyeSh7IGNvbG9yOiAnYmx1ZScgfSlcbiAqXG4gKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IHZhbFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24odmFsKXtcbiAgaWYgKCdzdHJpbmcnICE9IHR5cGVvZiB2YWwpIHZhbCA9IHNlcmlhbGl6ZSh2YWwpO1xuICBpZiAodmFsKSB0aGlzLl9xdWVyeS5wdXNoKHZhbCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBRdWV1ZSB0aGUgZ2l2ZW4gYGZpbGVgIGFzIGFuIGF0dGFjaG1lbnQgdG8gdGhlIHNwZWNpZmllZCBgZmllbGRgLFxuICogd2l0aCBvcHRpb25hbCBgb3B0aW9uc2AgKG9yIGZpbGVuYW1lKS5cbiAqXG4gKiBgYGAganNcbiAqIHJlcXVlc3QucG9zdCgnL3VwbG9hZCcpXG4gKiAgIC5hdHRhY2goJ2NvbnRlbnQnLCBuZXcgQmxvYihbJzxhIGlkPVwiYVwiPjxiIGlkPVwiYlwiPmhleSE8L2I+PC9hPiddLCB7IHR5cGU6IFwidGV4dC9odG1sXCJ9KSlcbiAqICAgLmVuZChjYWxsYmFjayk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqIEBwYXJhbSB7QmxvYnxGaWxlfSBmaWxlXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5hdHRhY2ggPSBmdW5jdGlvbihmaWVsZCwgZmlsZSwgb3B0aW9ucyl7XG4gIGlmIChmaWxlKSB7XG4gICAgaWYgKHRoaXMuX2RhdGEpIHtcbiAgICAgIHRocm93IEVycm9yKFwic3VwZXJhZ2VudCBjYW4ndCBtaXggLnNlbmQoKSBhbmQgLmF0dGFjaCgpXCIpO1xuICAgIH1cblxuICAgIHRoaXMuX2dldEZvcm1EYXRhKCkuYXBwZW5kKGZpZWxkLCBmaWxlLCBvcHRpb25zIHx8IGZpbGUubmFtZSk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5fZ2V0Rm9ybURhdGEgPSBmdW5jdGlvbigpe1xuICBpZiAoIXRoaXMuX2Zvcm1EYXRhKSB7XG4gICAgdGhpcy5fZm9ybURhdGEgPSBuZXcgcm9vdC5Gb3JtRGF0YSgpO1xuICB9XG4gIHJldHVybiB0aGlzLl9mb3JtRGF0YTtcbn07XG5cbi8qKlxuICogSW52b2tlIHRoZSBjYWxsYmFjayB3aXRoIGBlcnJgIGFuZCBgcmVzYFxuICogYW5kIGhhbmRsZSBhcml0eSBjaGVjay5cbiAqXG4gKiBAcGFyYW0ge0Vycm9yfSBlcnJcbiAqIEBwYXJhbSB7UmVzcG9uc2V9IHJlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuY2FsbGJhY2sgPSBmdW5jdGlvbihlcnIsIHJlcyl7XG4gIGlmICh0aGlzLl9zaG91bGRSZXRyeShlcnIsIHJlcykpIHtcbiAgICByZXR1cm4gdGhpcy5fcmV0cnkoKTtcbiAgfVxuXG4gIHZhciBmbiA9IHRoaXMuX2NhbGxiYWNrO1xuICB0aGlzLmNsZWFyVGltZW91dCgpO1xuXG4gIGlmIChlcnIpIHtcbiAgICBpZiAodGhpcy5fbWF4UmV0cmllcykgZXJyLnJldHJpZXMgPSB0aGlzLl9yZXRyaWVzIC0gMTtcbiAgICB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgfVxuXG4gIGZuKGVyciwgcmVzKTtcbn07XG5cbi8qKlxuICogSW52b2tlIGNhbGxiYWNrIHdpdGggeC1kb21haW4gZXJyb3IuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuY3Jvc3NEb21haW5FcnJvciA9IGZ1bmN0aW9uKCl7XG4gIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1JlcXVlc3QgaGFzIGJlZW4gdGVybWluYXRlZFxcblBvc3NpYmxlIGNhdXNlczogdGhlIG5ldHdvcmsgaXMgb2ZmbGluZSwgT3JpZ2luIGlzIG5vdCBhbGxvd2VkIGJ5IEFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbiwgdGhlIHBhZ2UgaXMgYmVpbmcgdW5sb2FkZWQsIGV0Yy4nKTtcbiAgZXJyLmNyb3NzRG9tYWluID0gdHJ1ZTtcblxuICBlcnIuc3RhdHVzID0gdGhpcy5zdGF0dXM7XG4gIGVyci5tZXRob2QgPSB0aGlzLm1ldGhvZDtcbiAgZXJyLnVybCA9IHRoaXMudXJsO1xuXG4gIHRoaXMuY2FsbGJhY2soZXJyKTtcbn07XG5cbi8vIFRoaXMgb25seSB3YXJucywgYmVjYXVzZSB0aGUgcmVxdWVzdCBpcyBzdGlsbCBsaWtlbHkgdG8gd29ya1xuUmVxdWVzdC5wcm90b3R5cGUuYnVmZmVyID0gUmVxdWVzdC5wcm90b3R5cGUuY2EgPSBSZXF1ZXN0LnByb3RvdHlwZS5hZ2VudCA9IGZ1bmN0aW9uKCl7XG4gIGNvbnNvbGUud2FybihcIlRoaXMgaXMgbm90IHN1cHBvcnRlZCBpbiBicm93c2VyIHZlcnNpb24gb2Ygc3VwZXJhZ2VudFwiKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBUaGlzIHRocm93cywgYmVjYXVzZSBpdCBjYW4ndCBzZW5kL3JlY2VpdmUgZGF0YSBhcyBleHBlY3RlZFxuUmVxdWVzdC5wcm90b3R5cGUucGlwZSA9IFJlcXVlc3QucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24oKXtcbiAgdGhyb3cgRXJyb3IoXCJTdHJlYW1pbmcgaXMgbm90IHN1cHBvcnRlZCBpbiBicm93c2VyIHZlcnNpb24gb2Ygc3VwZXJhZ2VudFwiKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgYG9iamAgaXMgYSBob3N0IG9iamVjdCxcbiAqIHdlIGRvbid0IHdhbnQgdG8gc2VyaWFsaXplIHRoZXNlIDopXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5SZXF1ZXN0LnByb3RvdHlwZS5faXNIb3N0ID0gZnVuY3Rpb24gX2lzSG9zdChvYmopIHtcbiAgLy8gTmF0aXZlIG9iamVjdHMgc3RyaW5naWZ5IHRvIFtvYmplY3QgRmlsZV0sIFtvYmplY3QgQmxvYl0sIFtvYmplY3QgRm9ybURhdGFdLCBldGMuXG4gIHJldHVybiBvYmogJiYgJ29iamVjdCcgPT09IHR5cGVvZiBvYmogJiYgIUFycmF5LmlzQXJyYXkob2JqKSAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSAhPT0gJ1tvYmplY3QgT2JqZWN0XSc7XG59XG5cbi8qKlxuICogSW5pdGlhdGUgcmVxdWVzdCwgaW52b2tpbmcgY2FsbGJhY2sgYGZuKHJlcylgXG4gKiB3aXRoIGFuIGluc3RhbmNlb2YgYFJlc3BvbnNlYC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uKGZuKXtcbiAgaWYgKHRoaXMuX2VuZENhbGxlZCkge1xuICAgIGNvbnNvbGUud2FybihcIldhcm5pbmc6IC5lbmQoKSB3YXMgY2FsbGVkIHR3aWNlLiBUaGlzIGlzIG5vdCBzdXBwb3J0ZWQgaW4gc3VwZXJhZ2VudFwiKTtcbiAgfVxuICB0aGlzLl9lbmRDYWxsZWQgPSB0cnVlO1xuXG4gIC8vIHN0b3JlIGNhbGxiYWNrXG4gIHRoaXMuX2NhbGxiYWNrID0gZm4gfHwgbm9vcDtcblxuICAvLyBxdWVyeXN0cmluZ1xuICB0aGlzLl9maW5hbGl6ZVF1ZXJ5U3RyaW5nKCk7XG5cbiAgcmV0dXJuIHRoaXMuX2VuZCgpO1xufTtcblxuUmVxdWVzdC5wcm90b3R5cGUuX2VuZCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciB4aHIgPSAodGhpcy54aHIgPSByZXF1ZXN0LmdldFhIUigpKTtcbiAgdmFyIGRhdGEgPSB0aGlzLl9mb3JtRGF0YSB8fCB0aGlzLl9kYXRhO1xuXG4gIHRoaXMuX3NldFRpbWVvdXRzKCk7XG5cbiAgLy8gc3RhdGUgY2hhbmdlXG4gIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpe1xuICAgIHZhciByZWFkeVN0YXRlID0geGhyLnJlYWR5U3RhdGU7XG4gICAgaWYgKHJlYWR5U3RhdGUgPj0gMiAmJiBzZWxmLl9yZXNwb25zZVRpbWVvdXRUaW1lcikge1xuICAgICAgY2xlYXJUaW1lb3V0KHNlbGYuX3Jlc3BvbnNlVGltZW91dFRpbWVyKTtcbiAgICB9XG4gICAgaWYgKDQgIT0gcmVhZHlTdGF0ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEluIElFOSwgcmVhZHMgdG8gYW55IHByb3BlcnR5IChlLmcuIHN0YXR1cykgb2ZmIG9mIGFuIGFib3J0ZWQgWEhSIHdpbGxcbiAgICAvLyByZXN1bHQgaW4gdGhlIGVycm9yIFwiQ291bGQgbm90IGNvbXBsZXRlIHRoZSBvcGVyYXRpb24gZHVlIHRvIGVycm9yIGMwMGMwMjNmXCJcbiAgICB2YXIgc3RhdHVzO1xuICAgIHRyeSB7IHN0YXR1cyA9IHhoci5zdGF0dXMgfSBjYXRjaChlKSB7IHN0YXR1cyA9IDA7IH1cblxuICAgIGlmICghc3RhdHVzKSB7XG4gICAgICBpZiAoc2VsZi50aW1lZG91dCB8fCBzZWxmLl9hYm9ydGVkKSByZXR1cm47XG4gICAgICByZXR1cm4gc2VsZi5jcm9zc0RvbWFpbkVycm9yKCk7XG4gICAgfVxuICAgIHNlbGYuZW1pdCgnZW5kJyk7XG4gIH07XG5cbiAgLy8gcHJvZ3Jlc3NcbiAgdmFyIGhhbmRsZVByb2dyZXNzID0gZnVuY3Rpb24oZGlyZWN0aW9uLCBlKSB7XG4gICAgaWYgKGUudG90YWwgPiAwKSB7XG4gICAgICBlLnBlcmNlbnQgPSBlLmxvYWRlZCAvIGUudG90YWwgKiAxMDA7XG4gICAgfVxuICAgIGUuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgIHNlbGYuZW1pdCgncHJvZ3Jlc3MnLCBlKTtcbiAgfTtcbiAgaWYgKHRoaXMuaGFzTGlzdGVuZXJzKCdwcm9ncmVzcycpKSB7XG4gICAgdHJ5IHtcbiAgICAgIHhoci5vbnByb2dyZXNzID0gaGFuZGxlUHJvZ3Jlc3MuYmluZChudWxsLCAnZG93bmxvYWQnKTtcbiAgICAgIGlmICh4aHIudXBsb2FkKSB7XG4gICAgICAgIHhoci51cGxvYWQub25wcm9ncmVzcyA9IGhhbmRsZVByb2dyZXNzLmJpbmQobnVsbCwgJ3VwbG9hZCcpO1xuICAgICAgfVxuICAgIH0gY2F0Y2goZSkge1xuICAgICAgLy8gQWNjZXNzaW5nIHhoci51cGxvYWQgZmFpbHMgaW4gSUUgZnJvbSBhIHdlYiB3b3JrZXIsIHNvIGp1c3QgcHJldGVuZCBpdCBkb2Vzbid0IGV4aXN0LlxuICAgICAgLy8gUmVwb3J0ZWQgaGVyZTpcbiAgICAgIC8vIGh0dHBzOi8vY29ubmVjdC5taWNyb3NvZnQuY29tL0lFL2ZlZWRiYWNrL2RldGFpbHMvODM3MjQ1L3htbGh0dHByZXF1ZXN0LXVwbG9hZC10aHJvd3MtaW52YWxpZC1hcmd1bWVudC13aGVuLXVzZWQtZnJvbS13ZWItd29ya2VyLWNvbnRleHRcbiAgICB9XG4gIH1cblxuICAvLyBpbml0aWF0ZSByZXF1ZXN0XG4gIHRyeSB7XG4gICAgaWYgKHRoaXMudXNlcm5hbWUgJiYgdGhpcy5wYXNzd29yZCkge1xuICAgICAgeGhyLm9wZW4odGhpcy5tZXRob2QsIHRoaXMudXJsLCB0cnVlLCB0aGlzLnVzZXJuYW1lLCB0aGlzLnBhc3N3b3JkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgeGhyLm9wZW4odGhpcy5tZXRob2QsIHRoaXMudXJsLCB0cnVlKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIHNlZSAjMTE0OVxuICAgIHJldHVybiB0aGlzLmNhbGxiYWNrKGVycik7XG4gIH1cblxuICAvLyBDT1JTXG4gIGlmICh0aGlzLl93aXRoQ3JlZGVudGlhbHMpIHhoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuXG4gIC8vIGJvZHlcbiAgaWYgKCF0aGlzLl9mb3JtRGF0YSAmJiAnR0VUJyAhPSB0aGlzLm1ldGhvZCAmJiAnSEVBRCcgIT0gdGhpcy5tZXRob2QgJiYgJ3N0cmluZycgIT0gdHlwZW9mIGRhdGEgJiYgIXRoaXMuX2lzSG9zdChkYXRhKSkge1xuICAgIC8vIHNlcmlhbGl6ZSBzdHVmZlxuICAgIHZhciBjb250ZW50VHlwZSA9IHRoaXMuX2hlYWRlclsnY29udGVudC10eXBlJ107XG4gICAgdmFyIHNlcmlhbGl6ZSA9IHRoaXMuX3NlcmlhbGl6ZXIgfHwgcmVxdWVzdC5zZXJpYWxpemVbY29udGVudFR5cGUgPyBjb250ZW50VHlwZS5zcGxpdCgnOycpWzBdIDogJyddO1xuICAgIGlmICghc2VyaWFsaXplICYmIGlzSlNPTihjb250ZW50VHlwZSkpIHtcbiAgICAgIHNlcmlhbGl6ZSA9IHJlcXVlc3Quc2VyaWFsaXplWydhcHBsaWNhdGlvbi9qc29uJ107XG4gICAgfVxuICAgIGlmIChzZXJpYWxpemUpIGRhdGEgPSBzZXJpYWxpemUoZGF0YSk7XG4gIH1cblxuICAvLyBzZXQgaGVhZGVyIGZpZWxkc1xuICBmb3IgKHZhciBmaWVsZCBpbiB0aGlzLmhlYWRlcikge1xuICAgIGlmIChudWxsID09IHRoaXMuaGVhZGVyW2ZpZWxkXSkgY29udGludWU7XG5cbiAgICBpZiAodGhpcy5oZWFkZXIuaGFzT3duUHJvcGVydHkoZmllbGQpKVxuICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoZmllbGQsIHRoaXMuaGVhZGVyW2ZpZWxkXSk7XG4gIH1cblxuICBpZiAodGhpcy5fcmVzcG9uc2VUeXBlKSB7XG4gICAgeGhyLnJlc3BvbnNlVHlwZSA9IHRoaXMuX3Jlc3BvbnNlVHlwZTtcbiAgfVxuXG4gIC8vIHNlbmQgc3R1ZmZcbiAgdGhpcy5lbWl0KCdyZXF1ZXN0JywgdGhpcyk7XG5cbiAgLy8gSUUxMSB4aHIuc2VuZCh1bmRlZmluZWQpIHNlbmRzICd1bmRlZmluZWQnIHN0cmluZyBhcyBQT1NUIHBheWxvYWQgKGluc3RlYWQgb2Ygbm90aGluZylcbiAgLy8gV2UgbmVlZCBudWxsIGhlcmUgaWYgZGF0YSBpcyB1bmRlZmluZWRcbiAgeGhyLnNlbmQodHlwZW9mIGRhdGEgIT09ICd1bmRlZmluZWQnID8gZGF0YSA6IG51bGwpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnJlcXVlc3QuYWdlbnQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBBZ2VudCgpO1xufTtcblxuW1wiR0VUXCIsIFwiUE9TVFwiLCBcIk9QVElPTlNcIiwgXCJQQVRDSFwiLCBcIlBVVFwiLCBcIkRFTEVURVwiXS5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZCkge1xuICBBZ2VudC5wcm90b3R5cGVbbWV0aG9kLnRvTG93ZXJDYXNlKCldID0gZnVuY3Rpb24odXJsLCBmbikge1xuICAgIHZhciByZXEgPSBuZXcgcmVxdWVzdC5SZXF1ZXN0KG1ldGhvZCwgdXJsKTtcbiAgICB0aGlzLl9zZXREZWZhdWx0cyhyZXEpO1xuICAgIGlmIChmbikge1xuICAgICAgcmVxLmVuZChmbik7XG4gICAgfVxuICAgIHJldHVybiByZXE7XG4gIH07XG59KTtcblxuQWdlbnQucHJvdG90eXBlLmRlbCA9IEFnZW50LnByb3RvdHlwZVsnZGVsZXRlJ107XG5cbi8qKlxuICogR0VUIGB1cmxgIHdpdGggb3B0aW9uYWwgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7TWl4ZWR8RnVuY3Rpb259IFtkYXRhXSBvciBmblxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2ZuXVxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucmVxdWVzdC5nZXQgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKSB7XG4gIHZhciByZXEgPSByZXF1ZXN0KCdHRVQnLCB1cmwpO1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgZGF0YSkgKGZuID0gZGF0YSksIChkYXRhID0gbnVsbCk7XG4gIGlmIChkYXRhKSByZXEucXVlcnkoZGF0YSk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG4vKipcbiAqIEhFQUQgYHVybGAgd2l0aCBvcHRpb25hbCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtNaXhlZHxGdW5jdGlvbn0gW2RhdGFdIG9yIGZuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0LmhlYWQgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKSB7XG4gIHZhciByZXEgPSByZXF1ZXN0KCdIRUFEJywgdXJsKTtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGRhdGEpIChmbiA9IGRhdGEpLCAoZGF0YSA9IG51bGwpO1xuICBpZiAoZGF0YSkgcmVxLnF1ZXJ5KGRhdGEpO1xuICBpZiAoZm4pIHJlcS5lbmQoZm4pO1xuICByZXR1cm4gcmVxO1xufTtcblxuLyoqXG4gKiBPUFRJT05TIHF1ZXJ5IHRvIGB1cmxgIHdpdGggb3B0aW9uYWwgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7TWl4ZWR8RnVuY3Rpb259IFtkYXRhXSBvciBmblxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2ZuXVxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucmVxdWVzdC5vcHRpb25zID0gZnVuY3Rpb24odXJsLCBkYXRhLCBmbikge1xuICB2YXIgcmVxID0gcmVxdWVzdCgnT1BUSU9OUycsIHVybCk7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBkYXRhKSAoZm4gPSBkYXRhKSwgKGRhdGEgPSBudWxsKTtcbiAgaWYgKGRhdGEpIHJlcS5zZW5kKGRhdGEpO1xuICBpZiAoZm4pIHJlcS5lbmQoZm4pO1xuICByZXR1cm4gcmVxO1xufTtcblxuLyoqXG4gKiBERUxFVEUgYHVybGAgd2l0aCBvcHRpb25hbCBgZGF0YWAgYW5kIGNhbGxiYWNrIGBmbihyZXMpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge01peGVkfSBbZGF0YV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtmbl1cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRlbCh1cmwsIGRhdGEsIGZuKSB7XG4gIHZhciByZXEgPSByZXF1ZXN0KCdERUxFVEUnLCB1cmwpO1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgZGF0YSkgKGZuID0gZGF0YSksIChkYXRhID0gbnVsbCk7XG4gIGlmIChkYXRhKSByZXEuc2VuZChkYXRhKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn1cblxucmVxdWVzdFsnZGVsJ10gPSBkZWw7XG5yZXF1ZXN0WydkZWxldGUnXSA9IGRlbDtcblxuLyoqXG4gKiBQQVRDSCBgdXJsYCB3aXRoIG9wdGlvbmFsIGBkYXRhYCBhbmQgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7TWl4ZWR9IFtkYXRhXVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2ZuXVxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucmVxdWVzdC5wYXRjaCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZm4pIHtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ1BBVENIJywgdXJsKTtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGRhdGEpIChmbiA9IGRhdGEpLCAoZGF0YSA9IG51bGwpO1xuICBpZiAoZGF0YSkgcmVxLnNlbmQoZGF0YSk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG4vKipcbiAqIFBPU1QgYHVybGAgd2l0aCBvcHRpb25hbCBgZGF0YWAgYW5kIGNhbGxiYWNrIGBmbihyZXMpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge01peGVkfSBbZGF0YV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtmbl1cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnJlcXVlc3QucG9zdCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZm4pIHtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ1BPU1QnLCB1cmwpO1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgZGF0YSkgKGZuID0gZGF0YSksIChkYXRhID0gbnVsbCk7XG4gIGlmIChkYXRhKSByZXEuc2VuZChkYXRhKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG5cbi8qKlxuICogUFVUIGB1cmxgIHdpdGggb3B0aW9uYWwgYGRhdGFgIGFuZCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtNaXhlZHxGdW5jdGlvbn0gW2RhdGFdIG9yIGZuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0LnB1dCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZm4pIHtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ1BVVCcsIHVybCk7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBkYXRhKSAoZm4gPSBkYXRhKSwgKGRhdGEgPSBudWxsKTtcbiAgaWYgKGRhdGEpIHJlcS5zZW5kKGRhdGEpO1xuICBpZiAoZm4pIHJlcS5lbmQoZm4pO1xuICByZXR1cm4gcmVxO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBDaGVjayBpZiBgb2JqYCBpcyBhbiBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGlzT2JqZWN0KG9iaikge1xuICByZXR1cm4gbnVsbCAhPT0gb2JqICYmICdvYmplY3QnID09PSB0eXBlb2Ygb2JqO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1vZHVsZSBvZiBtaXhlZC1pbiBmdW5jdGlvbnMgc2hhcmVkIGJldHdlZW4gbm9kZSBhbmQgY2xpZW50IGNvZGVcbiAqL1xudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pcy1vYmplY3QnKTtcblxuLyoqXG4gKiBFeHBvc2UgYFJlcXVlc3RCYXNlYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcXVlc3RCYXNlO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYFJlcXVlc3RCYXNlYC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIFJlcXVlc3RCYXNlKG9iaikge1xuICBpZiAob2JqKSByZXR1cm4gbWl4aW4ob2JqKTtcbn1cblxuLyoqXG4gKiBNaXhpbiB0aGUgcHJvdG90eXBlIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbWl4aW4ob2JqKSB7XG4gIGZvciAodmFyIGtleSBpbiBSZXF1ZXN0QmFzZS5wcm90b3R5cGUpIHtcbiAgICBvYmpba2V5XSA9IFJlcXVlc3RCYXNlLnByb3RvdHlwZVtrZXldO1xuICB9XG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogQ2xlYXIgcHJldmlvdXMgdGltZW91dC5cbiAqXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdEJhc2UucHJvdG90eXBlLmNsZWFyVGltZW91dCA9IGZ1bmN0aW9uIF9jbGVhclRpbWVvdXQoKXtcbiAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgY2xlYXJUaW1lb3V0KHRoaXMuX3Jlc3BvbnNlVGltZW91dFRpbWVyKTtcbiAgZGVsZXRlIHRoaXMuX3RpbWVyO1xuICBkZWxldGUgdGhpcy5fcmVzcG9uc2VUaW1lb3V0VGltZXI7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBPdmVycmlkZSBkZWZhdWx0IHJlc3BvbnNlIGJvZHkgcGFyc2VyXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB0byBjb252ZXJ0IGluY29taW5nIGRhdGEgaW50byByZXF1ZXN0LmJvZHlcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0QmFzZS5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiBwYXJzZShmbil7XG4gIHRoaXMuX3BhcnNlciA9IGZuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IGZvcm1hdCBvZiBiaW5hcnkgcmVzcG9uc2UgYm9keS5cbiAqIEluIGJyb3dzZXIgdmFsaWQgZm9ybWF0cyBhcmUgJ2Jsb2InIGFuZCAnYXJyYXlidWZmZXInLFxuICogd2hpY2ggcmV0dXJuIEJsb2IgYW5kIEFycmF5QnVmZmVyLCByZXNwZWN0aXZlbHkuXG4gKlxuICogSW4gTm9kZSBhbGwgdmFsdWVzIHJlc3VsdCBpbiBCdWZmZXIuXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAgICByZXEuZ2V0KCcvJylcbiAqICAgICAgICAucmVzcG9uc2VUeXBlKCdibG9iJylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdEJhc2UucHJvdG90eXBlLnJlc3BvbnNlVHlwZSA9IGZ1bmN0aW9uKHZhbCl7XG4gIHRoaXMuX3Jlc3BvbnNlVHlwZSA9IHZhbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE92ZXJyaWRlIGRlZmF1bHQgcmVxdWVzdCBib2R5IHNlcmlhbGl6ZXJcbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHRvIGNvbnZlcnQgZGF0YSBzZXQgdmlhIC5zZW5kIG9yIC5hdHRhY2ggaW50byBwYXlsb2FkIHRvIHNlbmRcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0QmFzZS5wcm90b3R5cGUuc2VyaWFsaXplID0gZnVuY3Rpb24gc2VyaWFsaXplKGZuKXtcbiAgdGhpcy5fc2VyaWFsaXplciA9IGZuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IHRpbWVvdXRzLlxuICpcbiAqIC0gcmVzcG9uc2UgdGltZW91dCBpcyB0aW1lIGJldHdlZW4gc2VuZGluZyByZXF1ZXN0IGFuZCByZWNlaXZpbmcgdGhlIGZpcnN0IGJ5dGUgb2YgdGhlIHJlc3BvbnNlLiBJbmNsdWRlcyBETlMgYW5kIGNvbm5lY3Rpb24gdGltZS5cbiAqIC0gZGVhZGxpbmUgaXMgdGhlIHRpbWUgZnJvbSBzdGFydCBvZiB0aGUgcmVxdWVzdCB0byByZWNlaXZpbmcgcmVzcG9uc2UgYm9keSBpbiBmdWxsLiBJZiB0aGUgZGVhZGxpbmUgaXMgdG9vIHNob3J0IGxhcmdlIGZpbGVzIG1heSBub3QgbG9hZCBhdCBhbGwgb24gc2xvdyBjb25uZWN0aW9ucy5cbiAqXG4gKiBWYWx1ZSBvZiAwIG9yIGZhbHNlIG1lYW5zIG5vIHRpbWVvdXQuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ8T2JqZWN0fSBtcyBvciB7cmVzcG9uc2UsIGRlYWRsaW5lfVxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3RCYXNlLnByb3RvdHlwZS50aW1lb3V0ID0gZnVuY3Rpb24gdGltZW91dChvcHRpb25zKXtcbiAgaWYgKCFvcHRpb25zIHx8ICdvYmplY3QnICE9PSB0eXBlb2Ygb3B0aW9ucykge1xuICAgIHRoaXMuX3RpbWVvdXQgPSBvcHRpb25zO1xuICAgIHRoaXMuX3Jlc3BvbnNlVGltZW91dCA9IDA7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBmb3IodmFyIG9wdGlvbiBpbiBvcHRpb25zKSB7XG4gICAgc3dpdGNoKG9wdGlvbikge1xuICAgICAgY2FzZSAnZGVhZGxpbmUnOlxuICAgICAgICB0aGlzLl90aW1lb3V0ID0gb3B0aW9ucy5kZWFkbGluZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdyZXNwb25zZSc6XG4gICAgICAgIHRoaXMuX3Jlc3BvbnNlVGltZW91dCA9IG9wdGlvbnMucmVzcG9uc2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS53YXJuKFwiVW5rbm93biB0aW1lb3V0IG9wdGlvblwiLCBvcHRpb24pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IG51bWJlciBvZiByZXRyeSBhdHRlbXB0cyBvbiBlcnJvci5cbiAqXG4gKiBGYWlsZWQgcmVxdWVzdHMgd2lsbCBiZSByZXRyaWVkICdjb3VudCcgdGltZXMgaWYgdGltZW91dCBvciBlcnIuY29kZSA+PSA1MDAuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdEJhc2UucHJvdG90eXBlLnJldHJ5ID0gZnVuY3Rpb24gcmV0cnkoY291bnQsIGZuKXtcbiAgLy8gRGVmYXVsdCB0byAxIGlmIG5vIGNvdW50IHBhc3NlZCBvciB0cnVlXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwIHx8IGNvdW50ID09PSB0cnVlKSBjb3VudCA9IDE7XG4gIGlmIChjb3VudCA8PSAwKSBjb3VudCA9IDA7XG4gIHRoaXMuX21heFJldHJpZXMgPSBjb3VudDtcbiAgdGhpcy5fcmV0cmllcyA9IDA7XG4gIHRoaXMuX3JldHJ5Q2FsbGJhY2sgPSBmbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG52YXIgRVJST1JfQ09ERVMgPSBbXG4gICdFQ09OTlJFU0VUJyxcbiAgJ0VUSU1FRE9VVCcsXG4gICdFQUREUklORk8nLFxuICAnRVNPQ0tFVFRJTUVET1VUJ1xuXTtcblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgYSByZXF1ZXN0IHNob3VsZCBiZSByZXRyaWVkLlxuICogKEJvcnJvd2VkIGZyb20gc2VnbWVudGlvL3N1cGVyYWdlbnQtcmV0cnkpXG4gKlxuICogQHBhcmFtIHtFcnJvcn0gZXJyXG4gKiBAcGFyYW0ge1Jlc3BvbnNlfSBbcmVzXVxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cblJlcXVlc3RCYXNlLnByb3RvdHlwZS5fc2hvdWxkUmV0cnkgPSBmdW5jdGlvbihlcnIsIHJlcykge1xuICBpZiAoIXRoaXMuX21heFJldHJpZXMgfHwgdGhpcy5fcmV0cmllcysrID49IHRoaXMuX21heFJldHJpZXMpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHRoaXMuX3JldHJ5Q2FsbGJhY2spIHtcbiAgICB0cnkge1xuICAgICAgdmFyIG92ZXJyaWRlID0gdGhpcy5fcmV0cnlDYWxsYmFjayhlcnIsIHJlcyk7XG4gICAgICBpZiAob3ZlcnJpZGUgPT09IHRydWUpIHJldHVybiB0cnVlO1xuICAgICAgaWYgKG92ZXJyaWRlID09PSBmYWxzZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgLy8gdW5kZWZpbmVkIGZhbGxzIGJhY2sgdG8gZGVmYXVsdHNcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgfVxuICB9XG4gIGlmIChyZXMgJiYgcmVzLnN0YXR1cyAmJiByZXMuc3RhdHVzID49IDUwMCAmJiByZXMuc3RhdHVzICE9IDUwMSkgcmV0dXJuIHRydWU7XG4gIGlmIChlcnIpIHtcbiAgICBpZiAoZXJyLmNvZGUgJiYgfkVSUk9SX0NPREVTLmluZGV4T2YoZXJyLmNvZGUpKSByZXR1cm4gdHJ1ZTtcbiAgICAvLyBTdXBlcmFnZW50IHRpbWVvdXRcbiAgICBpZiAoZXJyLnRpbWVvdXQgJiYgZXJyLmNvZGUgPT0gJ0VDT05OQUJPUlRFRCcpIHJldHVybiB0cnVlO1xuICAgIGlmIChlcnIuY3Jvc3NEb21haW4pIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogUmV0cnkgcmVxdWVzdFxuICpcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdEJhc2UucHJvdG90eXBlLl9yZXRyeSA9IGZ1bmN0aW9uKCkge1xuXG4gIHRoaXMuY2xlYXJUaW1lb3V0KCk7XG5cbiAgLy8gbm9kZVxuICBpZiAodGhpcy5yZXEpIHtcbiAgICB0aGlzLnJlcSA9IG51bGw7XG4gICAgdGhpcy5yZXEgPSB0aGlzLnJlcXVlc3QoKTtcbiAgfVxuXG4gIHRoaXMuX2Fib3J0ZWQgPSBmYWxzZTtcbiAgdGhpcy50aW1lZG91dCA9IGZhbHNlO1xuXG4gIHJldHVybiB0aGlzLl9lbmQoKTtcbn07XG5cbi8qKlxuICogUHJvbWlzZSBzdXBwb3J0XG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVzb2x2ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW3JlamVjdF1cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKi9cblxuUmVxdWVzdEJhc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbiB0aGVuKHJlc29sdmUsIHJlamVjdCkge1xuICBpZiAoIXRoaXMuX2Z1bGxmaWxsZWRQcm9taXNlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICh0aGlzLl9lbmRDYWxsZWQpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIldhcm5pbmc6IHN1cGVyYWdlbnQgcmVxdWVzdCB3YXMgc2VudCB0d2ljZSwgYmVjYXVzZSBib3RoIC5lbmQoKSBhbmQgLnRoZW4oKSB3ZXJlIGNhbGxlZC4gTmV2ZXIgY2FsbCAuZW5kKCkgaWYgeW91IHVzZSBwcm9taXNlc1wiKTtcbiAgICB9XG4gICAgdGhpcy5fZnVsbGZpbGxlZFByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihpbm5lclJlc29sdmUsIGlubmVyUmVqZWN0KSB7XG4gICAgICBzZWxmLmVuZChmdW5jdGlvbihlcnIsIHJlcykge1xuICAgICAgICBpZiAoZXJyKSBpbm5lclJlamVjdChlcnIpO1xuICAgICAgICBlbHNlIGlubmVyUmVzb2x2ZShyZXMpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2Z1bGxmaWxsZWRQcm9taXNlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbn07XG5cblJlcXVlc3RCYXNlLnByb3RvdHlwZVsnY2F0Y2gnXSA9IGZ1bmN0aW9uKGNiKSB7XG4gIHJldHVybiB0aGlzLnRoZW4odW5kZWZpbmVkLCBjYik7XG59O1xuXG4vKipcbiAqIEFsbG93IGZvciBleHRlbnNpb25cbiAqL1xuXG5SZXF1ZXN0QmFzZS5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24gdXNlKGZuKSB7XG4gIGZuKHRoaXMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblJlcXVlc3RCYXNlLnByb3RvdHlwZS5vayA9IGZ1bmN0aW9uKGNiKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgY2IpIHRocm93IEVycm9yKFwiQ2FsbGJhY2sgcmVxdWlyZWRcIik7XG4gIHRoaXMuX29rQ2FsbGJhY2sgPSBjYjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5SZXF1ZXN0QmFzZS5wcm90b3R5cGUuX2lzUmVzcG9uc2VPSyA9IGZ1bmN0aW9uKHJlcykge1xuICBpZiAoIXJlcykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICh0aGlzLl9va0NhbGxiYWNrKSB7XG4gICAgcmV0dXJuIHRoaXMuX29rQ2FsbGJhY2socmVzKTtcbiAgfVxuXG4gIHJldHVybiByZXMuc3RhdHVzID49IDIwMCAmJiByZXMuc3RhdHVzIDwgMzAwO1xufTtcblxuLyoqXG4gKiBHZXQgcmVxdWVzdCBoZWFkZXIgYGZpZWxkYC5cbiAqIENhc2UtaW5zZW5zaXRpdmUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3RCYXNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihmaWVsZCl7XG4gIHJldHVybiB0aGlzLl9oZWFkZXJbZmllbGQudG9Mb3dlckNhc2UoKV07XG59O1xuXG4vKipcbiAqIEdldCBjYXNlLWluc2Vuc2l0aXZlIGhlYWRlciBgZmllbGRgIHZhbHVlLlxuICogVGhpcyBpcyBhIGRlcHJlY2F0ZWQgaW50ZXJuYWwgQVBJLiBVc2UgYC5nZXQoZmllbGQpYCBpbnN0ZWFkLlxuICpcbiAqIChnZXRIZWFkZXIgaXMgbm8gbG9uZ2VyIHVzZWQgaW50ZXJuYWxseSBieSB0aGUgc3VwZXJhZ2VudCBjb2RlIGJhc2UpXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqIEBkZXByZWNhdGVkXG4gKi9cblxuUmVxdWVzdEJhc2UucHJvdG90eXBlLmdldEhlYWRlciA9IFJlcXVlc3RCYXNlLnByb3RvdHlwZS5nZXQ7XG5cbi8qKlxuICogU2V0IGhlYWRlciBgZmllbGRgIHRvIGB2YWxgLCBvciBtdWx0aXBsZSBmaWVsZHMgd2l0aCBvbmUgb2JqZWN0LlxuICogQ2FzZS1pbnNlbnNpdGl2ZS5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgIHJlcS5nZXQoJy8nKVxuICogICAgICAgIC5zZXQoJ0FjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uJylcbiAqICAgICAgICAuc2V0KCdYLUFQSS1LZXknLCAnZm9vYmFyJylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiAgICAgIHJlcS5nZXQoJy8nKVxuICogICAgICAgIC5zZXQoeyBBY2NlcHQ6ICdhcHBsaWNhdGlvbi9qc29uJywgJ1gtQVBJLUtleSc6ICdmb29iYXInIH0pXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBmaWVsZFxuICogQHBhcmFtIHtTdHJpbmd9IHZhbFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3RCYXNlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihmaWVsZCwgdmFsKXtcbiAgaWYgKGlzT2JqZWN0KGZpZWxkKSkge1xuICAgIGZvciAodmFyIGtleSBpbiBmaWVsZCkge1xuICAgICAgdGhpcy5zZXQoa2V5LCBmaWVsZFtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgdGhpcy5faGVhZGVyW2ZpZWxkLnRvTG93ZXJDYXNlKCldID0gdmFsO1xuICB0aGlzLmhlYWRlcltmaWVsZF0gPSB2YWw7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgaGVhZGVyIGBmaWVsZGAuXG4gKiBDYXNlLWluc2Vuc2l0aXZlLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogICAgICByZXEuZ2V0KCcvJylcbiAqICAgICAgICAudW5zZXQoJ1VzZXItQWdlbnQnKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZFxuICovXG5SZXF1ZXN0QmFzZS5wcm90b3R5cGUudW5zZXQgPSBmdW5jdGlvbihmaWVsZCl7XG4gIGRlbGV0ZSB0aGlzLl9oZWFkZXJbZmllbGQudG9Mb3dlckNhc2UoKV07XG4gIGRlbGV0ZSB0aGlzLmhlYWRlcltmaWVsZF07XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBXcml0ZSB0aGUgZmllbGQgYG5hbWVgIGFuZCBgdmFsYCwgb3IgbXVsdGlwbGUgZmllbGRzIHdpdGggb25lIG9iamVjdFxuICogZm9yIFwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiIHJlcXVlc3QgYm9kaWVzLlxuICpcbiAqIGBgYCBqc1xuICogcmVxdWVzdC5wb3N0KCcvdXBsb2FkJylcbiAqICAgLmZpZWxkKCdmb28nLCAnYmFyJylcbiAqICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogcmVxdWVzdC5wb3N0KCcvdXBsb2FkJylcbiAqICAgLmZpZWxkKHsgZm9vOiAnYmFyJywgYmF6OiAncXV4JyB9KVxuICogICAuZW5kKGNhbGxiYWNrKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gbmFtZVxuICogQHBhcmFtIHtTdHJpbmd8QmxvYnxGaWxlfEJ1ZmZlcnxmcy5SZWFkU3RyZWFtfSB2YWxcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuUmVxdWVzdEJhc2UucHJvdG90eXBlLmZpZWxkID0gZnVuY3Rpb24obmFtZSwgdmFsKSB7XG4gIC8vIG5hbWUgc2hvdWxkIGJlIGVpdGhlciBhIHN0cmluZyBvciBhbiBvYmplY3QuXG4gIGlmIChudWxsID09PSBuYW1lIHx8IHVuZGVmaW5lZCA9PT0gbmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignLmZpZWxkKG5hbWUsIHZhbCkgbmFtZSBjYW4gbm90IGJlIGVtcHR5Jyk7XG4gIH1cblxuICBpZiAodGhpcy5fZGF0YSkge1xuICAgIGNvbnNvbGUuZXJyb3IoXCIuZmllbGQoKSBjYW4ndCBiZSB1c2VkIGlmIC5zZW5kKCkgaXMgdXNlZC4gUGxlYXNlIHVzZSBvbmx5IC5zZW5kKCkgb3Igb25seSAuZmllbGQoKSAmIC5hdHRhY2goKVwiKTtcbiAgfVxuXG4gIGlmIChpc09iamVjdChuYW1lKSkge1xuICAgIGZvciAodmFyIGtleSBpbiBuYW1lKSB7XG4gICAgICB0aGlzLmZpZWxkKGtleSwgbmFtZVtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgZm9yICh2YXIgaSBpbiB2YWwpIHtcbiAgICAgIHRoaXMuZmllbGQobmFtZSwgdmFsW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyB2YWwgc2hvdWxkIGJlIGRlZmluZWQgbm93XG4gIGlmIChudWxsID09PSB2YWwgfHwgdW5kZWZpbmVkID09PSB2YWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJy5maWVsZChuYW1lLCB2YWwpIHZhbCBjYW4gbm90IGJlIGVtcHR5Jyk7XG4gIH1cbiAgaWYgKCdib29sZWFuJyA9PT0gdHlwZW9mIHZhbCkge1xuICAgIHZhbCA9ICcnICsgdmFsO1xuICB9XG4gIHRoaXMuX2dldEZvcm1EYXRhKCkuYXBwZW5kKG5hbWUsIHZhbCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBYm9ydCB0aGUgcmVxdWVzdCwgYW5kIGNsZWFyIHBvdGVudGlhbCB0aW1lb3V0LlxuICpcbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5SZXF1ZXN0QmFzZS5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbigpe1xuICBpZiAodGhpcy5fYWJvcnRlZCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHRoaXMuX2Fib3J0ZWQgPSB0cnVlO1xuICB0aGlzLnhociAmJiB0aGlzLnhoci5hYm9ydCgpOyAvLyBicm93c2VyXG4gIHRoaXMucmVxICYmIHRoaXMucmVxLmFib3J0KCk7IC8vIG5vZGVcbiAgdGhpcy5jbGVhclRpbWVvdXQoKTtcbiAgdGhpcy5lbWl0KCdhYm9ydCcpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblJlcXVlc3RCYXNlLnByb3RvdHlwZS5fYXV0aCA9IGZ1bmN0aW9uKHVzZXIsIHBhc3MsIG9wdGlvbnMsIGJhc2U2NEVuY29kZXIpIHtcbiAgc3dpdGNoIChvcHRpb25zLnR5cGUpIHtcbiAgICBjYXNlICdiYXNpYyc6XG4gICAgICB0aGlzLnNldCgnQXV0aG9yaXphdGlvbicsICdCYXNpYyAnICsgYmFzZTY0RW5jb2Rlcih1c2VyICsgJzonICsgcGFzcykpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdhdXRvJzpcbiAgICAgIHRoaXMudXNlcm5hbWUgPSB1c2VyO1xuICAgICAgdGhpcy5wYXNzd29yZCA9IHBhc3M7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ2JlYXJlcic6IC8vIHVzYWdlIHdvdWxkIGJlIC5hdXRoKGFjY2Vzc1Rva2VuLCB7IHR5cGU6ICdiZWFyZXInIH0pXG4gICAgICB0aGlzLnNldCgnQXV0aG9yaXphdGlvbicsICdCZWFyZXIgJyArIHVzZXIpO1xuICAgICAgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEVuYWJsZSB0cmFuc21pc3Npb24gb2YgY29va2llcyB3aXRoIHgtZG9tYWluIHJlcXVlc3RzLlxuICpcbiAqIE5vdGUgdGhhdCBmb3IgdGhpcyB0byB3b3JrIHRoZSBvcmlnaW4gbXVzdCBub3QgYmVcbiAqIHVzaW5nIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIgd2l0aCBhIHdpbGRjYXJkLFxuICogYW5kIGFsc28gbXVzdCBzZXQgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1DcmVkZW50aWFsc1wiXG4gKiB0byBcInRydWVcIi5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3RCYXNlLnByb3RvdHlwZS53aXRoQ3JlZGVudGlhbHMgPSBmdW5jdGlvbihvbikge1xuICAvLyBUaGlzIGlzIGJyb3dzZXItb25seSBmdW5jdGlvbmFsaXR5LiBOb2RlIHNpZGUgaXMgbm8tb3AuXG4gIGlmIChvbiA9PSB1bmRlZmluZWQpIG9uID0gdHJ1ZTtcbiAgdGhpcy5fd2l0aENyZWRlbnRpYWxzID0gb247XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIG1heCByZWRpcmVjdHMgdG8gYG5gLiBEb2VzIG5vdGluZyBpbiBicm93c2VyIFhIUiBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gblxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3RCYXNlLnByb3RvdHlwZS5yZWRpcmVjdHMgPSBmdW5jdGlvbihuKXtcbiAgdGhpcy5fbWF4UmVkaXJlY3RzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE1heGltdW0gc2l6ZSBvZiBidWZmZXJlZCByZXNwb25zZSBib2R5LCBpbiBieXRlcy4gQ291bnRzIHVuY29tcHJlc3NlZCBzaXplLlxuICogRGVmYXVsdCAyMDBNQi5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gblxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKi9cblJlcXVlc3RCYXNlLnByb3RvdHlwZS5tYXhSZXNwb25zZVNpemUgPSBmdW5jdGlvbihuKXtcbiAgaWYgKCdudW1iZXInICE9PSB0eXBlb2Ygbikge1xuICAgIHRocm93IFR5cGVFcnJvcihcIkludmFsaWQgYXJndW1lbnRcIik7XG4gIH1cbiAgdGhpcy5fbWF4UmVzcG9uc2VTaXplID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgdG8gYSBwbGFpbiBqYXZhc2NyaXB0IG9iamVjdCAobm90IEpTT04gc3RyaW5nKSBvZiBzY2FsYXIgcHJvcGVydGllcy5cbiAqIE5vdGUgYXMgdGhpcyBtZXRob2QgaXMgZGVzaWduZWQgdG8gcmV0dXJuIGEgdXNlZnVsIG5vbi10aGlzIHZhbHVlLFxuICogaXQgY2Fubm90IGJlIGNoYWluZWQuXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBkZXNjcmliaW5nIG1ldGhvZCwgdXJsLCBhbmQgZGF0YSBvZiB0aGlzIHJlcXVlc3RcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdEJhc2UucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIG1ldGhvZDogdGhpcy5tZXRob2QsXG4gICAgdXJsOiB0aGlzLnVybCxcbiAgICBkYXRhOiB0aGlzLl9kYXRhLFxuICAgIGhlYWRlcnM6IHRoaXMuX2hlYWRlcixcbiAgfTtcbn07XG5cbi8qKlxuICogU2VuZCBgZGF0YWAgYXMgdGhlIHJlcXVlc3QgYm9keSwgZGVmYXVsdGluZyB0aGUgYC50eXBlKClgIHRvIFwianNvblwiIHdoZW5cbiAqIGFuIG9iamVjdCBpcyBnaXZlbi5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgICAvLyBtYW51YWwganNvblxuICogICAgICAgcmVxdWVzdC5wb3N0KCcvdXNlcicpXG4gKiAgICAgICAgIC50eXBlKCdqc29uJylcbiAqICAgICAgICAgLnNlbmQoJ3tcIm5hbWVcIjpcInRqXCJ9JylcbiAqICAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiAgICAgICAvLyBhdXRvIGpzb25cbiAqICAgICAgIHJlcXVlc3QucG9zdCgnL3VzZXInKVxuICogICAgICAgICAuc2VuZCh7IG5hbWU6ICd0aicgfSlcbiAqICAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiAgICAgICAvLyBtYW51YWwgeC13d3ctZm9ybS11cmxlbmNvZGVkXG4gKiAgICAgICByZXF1ZXN0LnBvc3QoJy91c2VyJylcbiAqICAgICAgICAgLnR5cGUoJ2Zvcm0nKVxuICogICAgICAgICAuc2VuZCgnbmFtZT10aicpXG4gKiAgICAgICAgIC5lbmQoY2FsbGJhY2spXG4gKlxuICogICAgICAgLy8gYXV0byB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAqICAgICAgIHJlcXVlc3QucG9zdCgnL3VzZXInKVxuICogICAgICAgICAudHlwZSgnZm9ybScpXG4gKiAgICAgICAgIC5zZW5kKHsgbmFtZTogJ3RqJyB9KVxuICogICAgICAgICAuZW5kKGNhbGxiYWNrKVxuICpcbiAqICAgICAgIC8vIGRlZmF1bHRzIHRvIHgtd3d3LWZvcm0tdXJsZW5jb2RlZFxuICogICAgICByZXF1ZXN0LnBvc3QoJy91c2VyJylcbiAqICAgICAgICAuc2VuZCgnbmFtZT10b2JpJylcbiAqICAgICAgICAuc2VuZCgnc3BlY2llcz1mZXJyZXQnKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBkYXRhXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdEJhc2UucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihkYXRhKXtcbiAgdmFyIGlzT2JqID0gaXNPYmplY3QoZGF0YSk7XG4gIHZhciB0eXBlID0gdGhpcy5faGVhZGVyWydjb250ZW50LXR5cGUnXTtcblxuICBpZiAodGhpcy5fZm9ybURhdGEpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiLnNlbmQoKSBjYW4ndCBiZSB1c2VkIGlmIC5hdHRhY2goKSBvciAuZmllbGQoKSBpcyB1c2VkLiBQbGVhc2UgdXNlIG9ubHkgLnNlbmQoKSBvciBvbmx5IC5maWVsZCgpICYgLmF0dGFjaCgpXCIpO1xuICB9XG5cbiAgaWYgKGlzT2JqICYmICF0aGlzLl9kYXRhKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9pc0hvc3QoZGF0YSkpIHtcbiAgICAgIHRoaXMuX2RhdGEgPSB7fTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZGF0YSAmJiB0aGlzLl9kYXRhICYmIHRoaXMuX2lzSG9zdCh0aGlzLl9kYXRhKSkge1xuICAgIHRocm93IEVycm9yKFwiQ2FuJ3QgbWVyZ2UgdGhlc2Ugc2VuZCBjYWxsc1wiKTtcbiAgfVxuXG4gIC8vIG1lcmdlXG4gIGlmIChpc09iaiAmJiBpc09iamVjdCh0aGlzLl9kYXRhKSkge1xuICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICB0aGlzLl9kYXRhW2tleV0gPSBkYXRhW2tleV07XG4gICAgfVxuICB9IGVsc2UgaWYgKCdzdHJpbmcnID09IHR5cGVvZiBkYXRhKSB7XG4gICAgLy8gZGVmYXVsdCB0byB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAgICBpZiAoIXR5cGUpIHRoaXMudHlwZSgnZm9ybScpO1xuICAgIHR5cGUgPSB0aGlzLl9oZWFkZXJbJ2NvbnRlbnQtdHlwZSddO1xuICAgIGlmICgnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyA9PSB0eXBlKSB7XG4gICAgICB0aGlzLl9kYXRhID0gdGhpcy5fZGF0YVxuICAgICAgICA/IHRoaXMuX2RhdGEgKyAnJicgKyBkYXRhXG4gICAgICAgIDogZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZGF0YSA9ICh0aGlzLl9kYXRhIHx8ICcnKSArIGRhdGE7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMuX2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgaWYgKCFpc09iaiB8fCB0aGlzLl9pc0hvc3QoZGF0YSkpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGRlZmF1bHQgdG8ganNvblxuICBpZiAoIXR5cGUpIHRoaXMudHlwZSgnanNvbicpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU29ydCBgcXVlcnlzdHJpbmdgIGJ5IHRoZSBzb3J0IGZ1bmN0aW9uXG4gKlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgIC8vIGRlZmF1bHQgb3JkZXJcbiAqICAgICAgIHJlcXVlc3QuZ2V0KCcvdXNlcicpXG4gKiAgICAgICAgIC5xdWVyeSgnbmFtZT1OaWNrJylcbiAqICAgICAgICAgLnF1ZXJ5KCdzZWFyY2g9TWFubnknKVxuICogICAgICAgICAuc29ydFF1ZXJ5KClcbiAqICAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiAgICAgICAvLyBjdXN0b21pemVkIHNvcnQgZnVuY3Rpb25cbiAqICAgICAgIHJlcXVlc3QuZ2V0KCcvdXNlcicpXG4gKiAgICAgICAgIC5xdWVyeSgnbmFtZT1OaWNrJylcbiAqICAgICAgICAgLnF1ZXJ5KCdzZWFyY2g9TWFubnknKVxuICogICAgICAgICAuc29ydFF1ZXJ5KGZ1bmN0aW9uKGEsIGIpe1xuICogICAgICAgICAgIHJldHVybiBhLmxlbmd0aCAtIGIubGVuZ3RoO1xuICogICAgICAgICB9KVxuICogICAgICAgICAuZW5kKGNhbGxiYWNrKVxuICpcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBzb3J0XG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdEJhc2UucHJvdG90eXBlLnNvcnRRdWVyeSA9IGZ1bmN0aW9uKHNvcnQpIHtcbiAgLy8gX3NvcnQgZGVmYXVsdCB0byB0cnVlIGJ1dCBvdGhlcndpc2UgY2FuIGJlIGEgZnVuY3Rpb24gb3IgYm9vbGVhblxuICB0aGlzLl9zb3J0ID0gdHlwZW9mIHNvcnQgPT09ICd1bmRlZmluZWQnID8gdHJ1ZSA6IHNvcnQ7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDb21wb3NlIHF1ZXJ5c3RyaW5nIHRvIGFwcGVuZCB0byByZXEudXJsXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblJlcXVlc3RCYXNlLnByb3RvdHlwZS5fZmluYWxpemVRdWVyeVN0cmluZyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBxdWVyeSA9IHRoaXMuX3F1ZXJ5LmpvaW4oJyYnKTtcbiAgaWYgKHF1ZXJ5KSB7XG4gICAgdGhpcy51cmwgKz0gKHRoaXMudXJsLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHF1ZXJ5O1xuICB9XG4gIHRoaXMuX3F1ZXJ5Lmxlbmd0aCA9IDA7IC8vIE1ha2VzIHRoZSBjYWxsIGlkZW1wb3RlbnRcblxuICBpZiAodGhpcy5fc29ydCkge1xuICAgIHZhciBpbmRleCA9IHRoaXMudXJsLmluZGV4T2YoJz8nKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgdmFyIHF1ZXJ5QXJyID0gdGhpcy51cmwuc3Vic3RyaW5nKGluZGV4ICsgMSkuc3BsaXQoJyYnKTtcbiAgICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgdGhpcy5fc29ydCkge1xuICAgICAgICBxdWVyeUFyci5zb3J0KHRoaXMuX3NvcnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcXVlcnlBcnIuc29ydCgpO1xuICAgICAgfVxuICAgICAgdGhpcy51cmwgPSB0aGlzLnVybC5zdWJzdHJpbmcoMCwgaW5kZXgpICsgJz8nICsgcXVlcnlBcnIuam9pbignJicpO1xuICAgIH1cbiAgfVxufTtcblxuLy8gRm9yIGJhY2t3YXJkcyBjb21wYXQgb25seVxuUmVxdWVzdEJhc2UucHJvdG90eXBlLl9hcHBlbmRRdWVyeVN0cmluZyA9IGZ1bmN0aW9uKCkge2NvbnNvbGUudHJhY2UoXCJVbnN1cHBvcnRlZFwiKTt9XG5cbi8qKlxuICogSW52b2tlIGNhbGxiYWNrIHdpdGggdGltZW91dCBlcnJvci5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXF1ZXN0QmFzZS5wcm90b3R5cGUuX3RpbWVvdXRFcnJvciA9IGZ1bmN0aW9uKHJlYXNvbiwgdGltZW91dCwgZXJybm8pe1xuICBpZiAodGhpcy5fYWJvcnRlZCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgZXJyID0gbmV3IEVycm9yKHJlYXNvbiArIHRpbWVvdXQgKyAnbXMgZXhjZWVkZWQnKTtcbiAgZXJyLnRpbWVvdXQgPSB0aW1lb3V0O1xuICBlcnIuY29kZSA9ICdFQ09OTkFCT1JURUQnO1xuICBlcnIuZXJybm8gPSBlcnJubztcbiAgdGhpcy50aW1lZG91dCA9IHRydWU7XG4gIHRoaXMuYWJvcnQoKTtcbiAgdGhpcy5jYWxsYmFjayhlcnIpO1xufTtcblxuUmVxdWVzdEJhc2UucHJvdG90eXBlLl9zZXRUaW1lb3V0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgLy8gZGVhZGxpbmVcbiAgaWYgKHRoaXMuX3RpbWVvdXQgJiYgIXRoaXMuX3RpbWVyKSB7XG4gICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBzZWxmLl90aW1lb3V0RXJyb3IoJ1RpbWVvdXQgb2YgJywgc2VsZi5fdGltZW91dCwgJ0VUSU1FJyk7XG4gICAgfSwgdGhpcy5fdGltZW91dCk7XG4gIH1cbiAgLy8gcmVzcG9uc2UgdGltZW91dFxuICBpZiAodGhpcy5fcmVzcG9uc2VUaW1lb3V0ICYmICF0aGlzLl9yZXNwb25zZVRpbWVvdXRUaW1lcikge1xuICAgIHRoaXMuX3Jlc3BvbnNlVGltZW91dFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgc2VsZi5fdGltZW91dEVycm9yKCdSZXNwb25zZSB0aW1lb3V0IG9mICcsIHNlbGYuX3Jlc3BvbnNlVGltZW91dCwgJ0VUSU1FRE9VVCcpO1xuICAgIH0sIHRoaXMuX3Jlc3BvbnNlVGltZW91dCk7XG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbi8qKlxuICogRXhwb3NlIGBSZXNwb25zZUJhc2VgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gUmVzcG9uc2VCYXNlO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYFJlc3BvbnNlQmFzZWAuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBSZXNwb25zZUJhc2Uob2JqKSB7XG4gIGlmIChvYmopIHJldHVybiBtaXhpbihvYmopO1xufVxuXG4vKipcbiAqIE1peGluIHRoZSBwcm90b3R5cGUgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBtaXhpbihvYmopIHtcbiAgZm9yICh2YXIga2V5IGluIFJlc3BvbnNlQmFzZS5wcm90b3R5cGUpIHtcbiAgICBvYmpba2V5XSA9IFJlc3BvbnNlQmFzZS5wcm90b3R5cGVba2V5XTtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIEdldCBjYXNlLWluc2Vuc2l0aXZlIGBmaWVsZGAgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlc3BvbnNlQmFzZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oZmllbGQpIHtcbiAgcmV0dXJuIHRoaXMuaGVhZGVyW2ZpZWxkLnRvTG93ZXJDYXNlKCldO1xufTtcblxuLyoqXG4gKiBTZXQgaGVhZGVyIHJlbGF0ZWQgcHJvcGVydGllczpcbiAqXG4gKiAgIC0gYC50eXBlYCB0aGUgY29udGVudCB0eXBlIHdpdGhvdXQgcGFyYW1zXG4gKlxuICogQSByZXNwb25zZSBvZiBcIkNvbnRlbnQtVHlwZTogdGV4dC9wbGFpbjsgY2hhcnNldD11dGYtOFwiXG4gKiB3aWxsIHByb3ZpZGUgeW91IHdpdGggYSBgLnR5cGVgIG9mIFwidGV4dC9wbGFpblwiLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBoZWFkZXJcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlc3BvbnNlQmFzZS5wcm90b3R5cGUuX3NldEhlYWRlclByb3BlcnRpZXMgPSBmdW5jdGlvbihoZWFkZXIpe1xuICAgIC8vIFRPRE86IG1vYXIhXG4gICAgLy8gVE9ETzogbWFrZSB0aGlzIGEgdXRpbFxuXG4gICAgLy8gY29udGVudC10eXBlXG4gICAgdmFyIGN0ID0gaGVhZGVyWydjb250ZW50LXR5cGUnXSB8fCAnJztcbiAgICB0aGlzLnR5cGUgPSB1dGlscy50eXBlKGN0KTtcblxuICAgIC8vIHBhcmFtc1xuICAgIHZhciBwYXJhbXMgPSB1dGlscy5wYXJhbXMoY3QpO1xuICAgIGZvciAodmFyIGtleSBpbiBwYXJhbXMpIHRoaXNba2V5XSA9IHBhcmFtc1trZXldO1xuXG4gICAgdGhpcy5saW5rcyA9IHt9O1xuXG4gICAgLy8gbGlua3NcbiAgICB0cnkge1xuICAgICAgICBpZiAoaGVhZGVyLmxpbmspIHtcbiAgICAgICAgICAgIHRoaXMubGlua3MgPSB1dGlscy5wYXJzZUxpbmtzKGhlYWRlci5saW5rKTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyBpZ25vcmVcbiAgICB9XG59O1xuXG4vKipcbiAqIFNldCBmbGFncyBzdWNoIGFzIGAub2tgIGJhc2VkIG9uIGBzdGF0dXNgLlxuICpcbiAqIEZvciBleGFtcGxlIGEgMnh4IHJlc3BvbnNlIHdpbGwgZ2l2ZSB5b3UgYSBgLm9rYCBvZiBfX3RydWVfX1xuICogd2hlcmVhcyA1eHggd2lsbCBiZSBfX2ZhbHNlX18gYW5kIGAuZXJyb3JgIHdpbGwgYmUgX190cnVlX18uIFRoZVxuICogYC5jbGllbnRFcnJvcmAgYW5kIGAuc2VydmVyRXJyb3JgIGFyZSBhbHNvIGF2YWlsYWJsZSB0byBiZSBtb3JlXG4gKiBzcGVjaWZpYywgYW5kIGAuc3RhdHVzVHlwZWAgaXMgdGhlIGNsYXNzIG9mIGVycm9yIHJhbmdpbmcgZnJvbSAxLi41XG4gKiBzb21ldGltZXMgdXNlZnVsIGZvciBtYXBwaW5nIHJlc3BvbmQgY29sb3JzIGV0Yy5cbiAqXG4gKiBcInN1Z2FyXCIgcHJvcGVydGllcyBhcmUgYWxzbyBkZWZpbmVkIGZvciBjb21tb24gY2FzZXMuIEN1cnJlbnRseSBwcm92aWRpbmc6XG4gKlxuICogICAtIC5ub0NvbnRlbnRcbiAqICAgLSAuYmFkUmVxdWVzdFxuICogICAtIC51bmF1dGhvcml6ZWRcbiAqICAgLSAubm90QWNjZXB0YWJsZVxuICogICAtIC5ub3RGb3VuZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdGF0dXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlc3BvbnNlQmFzZS5wcm90b3R5cGUuX3NldFN0YXR1c1Byb3BlcnRpZXMgPSBmdW5jdGlvbihzdGF0dXMpe1xuICAgIHZhciB0eXBlID0gc3RhdHVzIC8gMTAwIHwgMDtcblxuICAgIC8vIHN0YXR1cyAvIGNsYXNzXG4gICAgdGhpcy5zdGF0dXMgPSB0aGlzLnN0YXR1c0NvZGUgPSBzdGF0dXM7XG4gICAgdGhpcy5zdGF0dXNUeXBlID0gdHlwZTtcblxuICAgIC8vIGJhc2ljc1xuICAgIHRoaXMuaW5mbyA9IDEgPT0gdHlwZTtcbiAgICB0aGlzLm9rID0gMiA9PSB0eXBlO1xuICAgIHRoaXMucmVkaXJlY3QgPSAzID09IHR5cGU7XG4gICAgdGhpcy5jbGllbnRFcnJvciA9IDQgPT0gdHlwZTtcbiAgICB0aGlzLnNlcnZlckVycm9yID0gNSA9PSB0eXBlO1xuICAgIHRoaXMuZXJyb3IgPSAoNCA9PSB0eXBlIHx8IDUgPT0gdHlwZSlcbiAgICAgICAgPyB0aGlzLnRvRXJyb3IoKVxuICAgICAgICA6IGZhbHNlO1xuXG4gICAgLy8gc3VnYXJcbiAgICB0aGlzLmNyZWF0ZWQgPSAyMDEgPT0gc3RhdHVzO1xuICAgIHRoaXMuYWNjZXB0ZWQgPSAyMDIgPT0gc3RhdHVzO1xuICAgIHRoaXMubm9Db250ZW50ID0gMjA0ID09IHN0YXR1cztcbiAgICB0aGlzLmJhZFJlcXVlc3QgPSA0MDAgPT0gc3RhdHVzO1xuICAgIHRoaXMudW5hdXRob3JpemVkID0gNDAxID09IHN0YXR1cztcbiAgICB0aGlzLm5vdEFjY2VwdGFibGUgPSA0MDYgPT0gc3RhdHVzO1xuICAgIHRoaXMuZm9yYmlkZGVuID0gNDAzID09IHN0YXR1cztcbiAgICB0aGlzLm5vdEZvdW5kID0gNDA0ID09IHN0YXR1cztcbiAgICB0aGlzLnVucHJvY2Vzc2FibGVFbnRpdHkgPSA0MjIgPT0gc3RhdHVzO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG1pbWUgdHlwZSBmb3IgdGhlIGdpdmVuIGBzdHJgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmV4cG9ydHMudHlwZSA9IGZ1bmN0aW9uKHN0cil7XG4gIHJldHVybiBzdHIuc3BsaXQoLyAqOyAqLykuc2hpZnQoKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIGhlYWRlciBmaWVsZCBwYXJhbWV0ZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmV4cG9ydHMucGFyYW1zID0gZnVuY3Rpb24oc3RyKXtcbiAgcmV0dXJuIHN0ci5zcGxpdCgvICo7ICovKS5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBzdHIpe1xuICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgvICo9ICovKTtcbiAgICB2YXIga2V5ID0gcGFydHMuc2hpZnQoKTtcbiAgICB2YXIgdmFsID0gcGFydHMuc2hpZnQoKTtcblxuICAgIGlmIChrZXkgJiYgdmFsKSBvYmpba2V5XSA9IHZhbDtcbiAgICByZXR1cm4gb2JqO1xuICB9LCB7fSk7XG59O1xuXG4vKipcbiAqIFBhcnNlIExpbmsgaGVhZGVyIGZpZWxkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5leHBvcnRzLnBhcnNlTGlua3MgPSBmdW5jdGlvbihzdHIpe1xuICByZXR1cm4gc3RyLnNwbGl0KC8gKiwgKi8pLnJlZHVjZShmdW5jdGlvbihvYmosIHN0cil7XG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KC8gKjsgKi8pO1xuICAgIHZhciB1cmwgPSBwYXJ0c1swXS5zbGljZSgxLCAtMSk7XG4gICAgdmFyIHJlbCA9IHBhcnRzWzFdLnNwbGl0KC8gKj0gKi8pWzFdLnNsaWNlKDEsIC0xKTtcbiAgICBvYmpbcmVsXSA9IHVybDtcbiAgICByZXR1cm4gb2JqO1xuICB9LCB7fSk7XG59O1xuXG4vKipcbiAqIFN0cmlwIGNvbnRlbnQgcmVsYXRlZCBmaWVsZHMgZnJvbSBgaGVhZGVyYC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaGVhZGVyXG4gKiBAcmV0dXJuIHtPYmplY3R9IGhlYWRlclxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZXhwb3J0cy5jbGVhbkhlYWRlciA9IGZ1bmN0aW9uKGhlYWRlciwgY2hhbmdlc09yaWdpbil7XG4gIGRlbGV0ZSBoZWFkZXJbJ2NvbnRlbnQtdHlwZSddO1xuICBkZWxldGUgaGVhZGVyWydjb250ZW50LWxlbmd0aCddO1xuICBkZWxldGUgaGVhZGVyWyd0cmFuc2Zlci1lbmNvZGluZyddO1xuICBkZWxldGUgaGVhZGVyWydob3N0J107XG4gIC8vIHNlY3VpcnR5XG4gIGlmIChjaGFuZ2VzT3JpZ2luKSB7XG4gICAgZGVsZXRlIGhlYWRlclsnYXV0aG9yaXphdGlvbiddO1xuICAgIGRlbGV0ZSBoZWFkZXJbJ2Nvb2tpZSddO1xuICB9XG4gIHJldHVybiBoZWFkZXI7XG59O1xuIiwidmFyIHNjb3BlID0gKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgJiYgZ2xvYmFsKSB8fFxuICAgICAgICAgICAgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiICYmIHNlbGYpIHx8XG4gICAgICAgICAgICB3aW5kb3c7XG52YXIgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHk7XG5cbi8vIERPTSBBUElzLCBmb3IgY29tcGxldGVuZXNzXG5cbmV4cG9ydHMuc2V0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRUaW1lb3V0LCBzY29wZSwgYXJndW1lbnRzKSwgY2xlYXJUaW1lb3V0KTtcbn07XG5leHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldEludGVydmFsLCBzY29wZSwgYXJndW1lbnRzKSwgY2xlYXJJbnRlcnZhbCk7XG59O1xuZXhwb3J0cy5jbGVhclRpbWVvdXQgPVxuZXhwb3J0cy5jbGVhckludGVydmFsID0gZnVuY3Rpb24odGltZW91dCkge1xuICBpZiAodGltZW91dCkge1xuICAgIHRpbWVvdXQuY2xvc2UoKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gVGltZW91dChpZCwgY2xlYXJGbikge1xuICB0aGlzLl9pZCA9IGlkO1xuICB0aGlzLl9jbGVhckZuID0gY2xlYXJGbjtcbn1cblRpbWVvdXQucHJvdG90eXBlLnVucmVmID0gVGltZW91dC5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7fTtcblRpbWVvdXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2NsZWFyRm4uY2FsbChzY29wZSwgdGhpcy5faWQpO1xufTtcblxuLy8gRG9lcyBub3Qgc3RhcnQgdGhlIHRpbWUsIGp1c3Qgc2V0cyB1cCB0aGUgbWVtYmVycyBuZWVkZWQuXG5leHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIG1zZWNzKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSBtc2Vjcztcbn07XG5cbmV4cG9ydHMudW5lbnJvbGwgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSAtMTtcbn07XG5cbmV4cG9ydHMuX3VucmVmQWN0aXZlID0gZXhwb3J0cy5hY3RpdmUgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblxuICB2YXIgbXNlY3MgPSBpdGVtLl9pZGxlVGltZW91dDtcbiAgaWYgKG1zZWNzID49IDApIHtcbiAgICBpdGVtLl9pZGxlVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiBvblRpbWVvdXQoKSB7XG4gICAgICBpZiAoaXRlbS5fb25UaW1lb3V0KVxuICAgICAgICBpdGVtLl9vblRpbWVvdXQoKTtcbiAgICB9LCBtc2Vjcyk7XG4gIH1cbn07XG5cbi8vIHNldGltbWVkaWF0ZSBhdHRhY2hlcyBpdHNlbGYgdG8gdGhlIGdsb2JhbCBvYmplY3RcbnJlcXVpcmUoXCJzZXRpbW1lZGlhdGVcIik7XG4vLyBPbiBzb21lIGV4b3RpYyBlbnZpcm9ubWVudHMsIGl0J3Mgbm90IGNsZWFyIHdoaWNoIG9iamVjdCBgc2V0aW1tZWRpYXRlYCB3YXNcbi8vIGFibGUgdG8gaW5zdGFsbCBvbnRvLiAgU2VhcmNoIGVhY2ggcG9zc2liaWxpdHkgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhlXG4vLyBgc2V0aW1tZWRpYXRlYCBsaWJyYXJ5LlxuZXhwb3J0cy5zZXRJbW1lZGlhdGUgPSAodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgJiYgc2VsZi5zZXRJbW1lZGlhdGUpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiICYmIGdsb2JhbC5zZXRJbW1lZGlhdGUpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICh0aGlzICYmIHRoaXMuc2V0SW1tZWRpYXRlKTtcbmV4cG9ydHMuY2xlYXJJbW1lZGlhdGUgPSAodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgJiYgc2VsZi5jbGVhckltbWVkaWF0ZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBnbG9iYWwuY2xlYXJJbW1lZGlhdGUpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMgJiYgdGhpcy5jbGVhckltbWVkaWF0ZSk7XG4iLCJ2YXIgZztcblxuLy8gVGhpcyB3b3JrcyBpbiBub24tc3RyaWN0IG1vZGVcbmcgPSAoZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzO1xufSkoKTtcblxudHJ5IHtcblx0Ly8gVGhpcyB3b3JrcyBpZiBldmFsIGlzIGFsbG93ZWQgKHNlZSBDU1ApXG5cdGcgPSBnIHx8IG5ldyBGdW5jdGlvbihcInJldHVybiB0aGlzXCIpKCk7XG59IGNhdGNoIChlKSB7XG5cdC8vIFRoaXMgd29ya3MgaWYgdGhlIHdpbmRvdyByZWZlcmVuY2UgaXMgYXZhaWxhYmxlXG5cdGlmICh0eXBlb2Ygd2luZG93ID09PSBcIm9iamVjdFwiKSBnID0gd2luZG93O1xufVxuXG4vLyBnIGNhbiBzdGlsbCBiZSB1bmRlZmluZWQsIGJ1dCBub3RoaW5nIHRvIGRvIGFib3V0IGl0Li4uXG4vLyBXZSByZXR1cm4gdW5kZWZpbmVkLCBpbnN0ZWFkIG9mIG5vdGhpbmcgaGVyZSwgc28gaXQnc1xuLy8gZWFzaWVyIHRvIGhhbmRsZSB0aGlzIGNhc2UuIGlmKCFnbG9iYWwpIHsgLi4ufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGc7XG4iXSwic291cmNlUm9vdCI6IiJ9