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

exports.default = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(_ref) {
    var accessKey = _ref.accessKey,
        app = _ref.app,
        tenant = _ref.tenant,
        stage = _ref.stage,
        service = _ref.service;
    var response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _fetch2.default)(`${_config2.default.backendUrl}tenants/${tenant}/applications/${app}/profileValue`, {
              method: 'POST',
              headers: { Authorization: `bearer ${accessKey}` },
              body: JSON.stringify({
                stageName: stage,
                serviceName: service
              })
            });

          case 2:
            response = _context.sent;

            if (!(response.status === 204)) {
              _context.next = 5;
              break;
            }

            return _context.abrupt('return', { secretValues: [], safeguardsPolicies: [], providerCredentials: null });

          case 5:
            return _context.abrupt('return', response.json());

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function (_x) {
    return _ref2.apply(this, arguments);
  };
}();
//# sourceMappingURL=getDeployProfile.js.map