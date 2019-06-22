'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var checkHttpResponse = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(response, prefix) {
    var msgParts;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!response.ok) {
              _context.next = 2;
              break;
            }

            return _context.abrupt('return', response);

          case 2:
            msgParts = [];

            if (prefix) {
              msgParts.push(`${prefix}:`);
            }
            _context.t0 = response.statusCode;
            _context.next = _context.t0 === 401 ? 7 : _context.t0 === 403 ? 9 : 11;
            break;

          case 7:
            msgParts.push('Authentication error. Please check your credentials.');
            return _context.abrupt('break', 11);

          case 9:
            msgParts.push('Authorization error. You are not permitted to perform this action.');
            return _context.abrupt('break', 11);

          case 11:
            _context.t1 = msgParts;
            _context.next = 14;
            return response.text();

          case 14:
            _context.t2 = _context.sent;

            _context.t1.push.call(_context.t1, _context.t2);

            throw new Error(msgParts.join(' '));

          case 17:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function checkHttpResponse(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

exports.default = checkHttpResponse;
//# sourceMappingURL=checkHttpResponse.js.map