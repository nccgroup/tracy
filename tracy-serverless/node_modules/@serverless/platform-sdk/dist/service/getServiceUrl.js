'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getServiceUrl = function getServiceUrl(data) {
  return `${_config2.default.frontendUrl}tenants/${data.tenant}/applications/${data.app}/services/${data.name}`;
};

exports.default = getServiceUrl;
//# sourceMappingURL=getServiceUrl.js.map