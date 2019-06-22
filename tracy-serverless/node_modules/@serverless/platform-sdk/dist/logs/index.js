'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createDestination = require('./createDestination');

Object.defineProperty(exports, 'getLogDestination', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_createDestination).default;
  }
});

var _removeDestination = require('./removeDestination');

Object.defineProperty(exports, 'removeLogDestination', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_removeDestination).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=index.js.map