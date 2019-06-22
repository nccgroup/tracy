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

var archiveService = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(data) {
    var body, response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            body = {
              provider: data.provider,
              region: data.region
            };
            _context.next = 3;
            return (0, _fetch2.default)(`${_config2.default.backendUrl}tenants/${data.tenant}/applications/${data.app}/services/${data.name}`, {
              method: 'PUT',
              body: JSON.stringify(body),
              headers: { Authorization: `bearer ${data.accessKey}` }
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

  return function archiveService(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.default = archiveService;
//# sourceMappingURL=archiveService.js.map