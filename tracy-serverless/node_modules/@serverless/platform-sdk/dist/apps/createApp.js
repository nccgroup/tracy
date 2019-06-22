'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fetch = require('../fetch');

var _fetch2 = _interopRequireDefault(_fetch);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var slugifyApp = function slugifyApp(text) {
  return text.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-') // Replace any run of disallowed chars with a hyphen
  .replace(/^-+/, '') // remove leading hyphens
  .replace(/-+$/, '');
}; // remove trailing hyphens

var createApp = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(data) {
    var body, response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            body = JSON.stringify({
              tenantName: data.tenant,
              appName: slugifyApp(data.app),
              title: data.app
            });
            _context.next = 3;
            return (0, _fetch2.default)(`${_config2.default.backendUrl}tenants/${data.tenant}/applications`, {
              method: 'POST',
              body,
              headers: {
                Authorization: `bearer ${data.token}`
              }
            });

          case 3:
            response = _context.sent;
            return _context.abrupt('return', response.json());

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function createApp(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.default = createApp;
//# sourceMappingURL=createApp.js.map