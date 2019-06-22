'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fetch = require('../fetch');

var _fetch2 = _interopRequireDefault(_fetch);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var createDestination = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(_ref) {
    var tenantUid = _ref.tenantUid,
        appUid = _ref.appUid,
        serviceName = _ref.serviceName,
        stageName = _ref.stageName,
        regionName = _ref.regionName,
        accountId = _ref.accountId,
        accessKey = _ref.accessKey;
    var body, response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            body = JSON.stringify({
              tenantUid,
              appUid,
              serviceName,
              stageName,
              regionName,
              accountId
            });
            _context.next = 3;
            return (0, _fetch2.default)(`${_config2.default.logDestinationUrl}destinations/create`, {
              method: 'POST',
              body,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `bearer ${accessKey}`
              }
            });

          case 3:
            response = _context.sent;
            _context.next = 6;
            return (0, _utils.checkHttpResponse)(response);

          case 6:
            return _context.abrupt('return', response.json());

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function createDestination(_x) {
    return _ref2.apply(this, arguments);
  };
}();

exports.default = createDestination;
//# sourceMappingURL=createDestination.js.map