'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fetch = require('../fetch');

var _fetch2 = _interopRequireDefault(_fetch);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _accessKeys = require('../accessKeys');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var getApp = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(data) {
    var token, response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            token = data.token;

            if (token) {
              _context.next = 5;
              break;
            }

            _context.next = 4;
            return (0, _accessKeys.getAccessKeyForTenant)(data.tenant);

          case 4:
            token = _context.sent;

          case 5:
            _context.next = 7;
            return (0, _fetch2.default)(`${_config2.default.backendUrl}tenants/${data.tenant}/applications/${data.app}`, {
              method: 'GET',
              headers: {
                Authorization: `bearer ${token}`
              }
            });

          case 7:
            response = _context.sent;
            return _context.abrupt('return', response.json());

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function getApp(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.default = getApp;
//# sourceMappingURL=getApp.js.map