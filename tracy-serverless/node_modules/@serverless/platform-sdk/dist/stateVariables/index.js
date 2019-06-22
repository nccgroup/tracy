'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStateVariable = undefined;

var _fetch = require('../fetch');

var _fetch2 = _interopRequireDefault(_fetch);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var getStateVariable = exports.getStateVariable = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(_ref) {
    var accessKey = _ref.accessKey,
        outputName = _ref.outputName,
        app = _ref.app,
        tenant = _ref.tenant,
        stage = _ref.stage,
        service = _ref.service,
        region = _ref.region;
    var response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _fetch2.default)(`${_config2.default.backendUrl}tenants/${tenant}/applications/${app}/services/${service}/stages/${stage}/regions/${region}/outputs`, {
              method: 'POST',
              headers: { Authorization: `bearer ${accessKey}` },
              body: JSON.stringify({ outputName })
            });

          case 2:
            response = _context.sent;
            return _context.abrupt('return', response.json());

          case 4:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function getStateVariable(_x) {
    return _ref2.apply(this, arguments);
  };
}();
//# sourceMappingURL=index.js.map