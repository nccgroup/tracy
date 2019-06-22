"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
var sns_template_json_1 = __importDefault(require("./events/aws/sns-template.json"));
var sqs_template_json_1 = __importDefault(require("./events/aws/sqs-template.json"));
var api_gateway_event_template_json_1 = __importDefault(require("./events/aws/api-gateway-event-template.json"));
var scheduled_template_json_1 = __importDefault(require("./events/aws/scheduled-template.json"));
var s3_template_json_1 = __importDefault(require("./events/aws/s3-template.json"));
var kinesis_template_json_1 = __importDefault(require("./events/aws/kinesis-template.json"));
var dynamo_stream_event_template_json_1 = __importDefault(require("./events/aws/dynamo-stream-event-template.json"));
var cloud_watch_log_event_template_json_1 = __importDefault(require("./events/aws/cloud-watch-log-event-template.json"));
var alexa_smart_home_event_template_json_1 = __importDefault(require("./events/aws/alexa-smart-home-event-template.json"));
var alexa_skill_event_template_json_1 = __importDefault(require("./events/aws/alexa-skill-event-template.json"));
var cloud_watch_event_template_json_1 = __importDefault(require("./events/aws/cloud-watch-event-template.json"));
var cognito_user_pool_event_template_json_1 = __importDefault(require("./events/aws/cognito-user-pool-event-template.json"));
var dictionary = {
    "aws:sns": sns_template_json_1.default,
    "aws:sqs": sqs_template_json_1.default,
    "aws:apiGateway": api_gateway_event_template_json_1.default,
    "aws:scheduled": scheduled_template_json_1.default,
    "aws:s3": s3_template_json_1.default,
    "aws:kinesis": kinesis_template_json_1.default,
    "aws:dynamo": dynamo_stream_event_template_json_1.default,
    "aws:cloudWatchLog": cloud_watch_log_event_template_json_1.default,
    "aws:alexaSmartHome": alexa_smart_home_event_template_json_1.default,
    "aws:alexaSkill": alexa_skill_event_template_json_1.default,
    "aws:cloudWatch": cloud_watch_event_template_json_1.default,
    "aws:iot": {},
    "aws:cognitoUserPool": cognito_user_pool_event_template_json_1.default,
    "aws:websocket": api_gateway_event_template_json_1.default,
};
function createEvent(eventType, body) {
    var event = dictionary[eventType];
    var generatedEvent = {};
    if (event) {
        generatedEvent = lodash_1.merge(lodash_1.cloneDeep(event), body);
    }
    return generatedEvent;
}
exports.default = createEvent;
//# sourceMappingURL=index.js.map